import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { hoursUntilClass } from "@/lib/class-time"

// GET a specific booking
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    // Only admin or the booking owner can view it
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Cancel a booking (must be at least 8 hours before class)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const bookingId = params.id
    
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        class: true
      }
    })

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    // Verify booking belongs to user or user is admin
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ message: "You can only cancel your own bookings" }, { status: 403 })
    }

    // Check if cancellation is allowed (at least 8 hours before class)
    const hoursBeforeClass = hoursUntilClass(booking.class.date, booking.class.time)

    if (hoursBeforeClass < 8 && user.role !== "admin") {
      return NextResponse.json({ 
        message: "Cancellation is only allowed at least 8 hours before the class starts" 
      }, { status: 400 })
    }

    // Get the class to decrement current bookings
    const classData = await prisma.class.findUnique({
      where: { id: booking.classId }
    })

    if (!classData) {
      return NextResponse.json({ message: "Class not found" }, { status: 404 })
    }

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Get user info for notification
      const bookingUser = await tx.user.findUnique({
        where: { id: booking.userId },
        select: { name: true, email: true }
      })

      // Delete the booking
      const deletedBooking = await tx.booking.delete({
        where: { id: bookingId }
      })

      // Decrement current bookings
      const updatedClass = await tx.class.update({
        where: { id: booking.classId },
        data: { 
          currentBookings: {
            decrement: 1
          }
        }
      })

      // Create a notification for the user
      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "booking_cancelled",
          message: `Your booking for ${booking.class.name} on ${new Date(booking.class.date).toLocaleDateString()} at ${booking.class.time} has been cancelled.`
        }
      })

      // Create admin notifications for cancellation
      const formattedDate = new Date(booking.class.date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
      
      const adminUsers = await tx.user.findMany({
        where: { role: 'admin' },
        select: { id: true }
      })

      // Create a notification for each admin
      await Promise.all(
        adminUsers.map((admin) =>
          tx.notification.create({
            data: {
              userId: admin.id,
              type: 'admin_cancellation',
              message: `${bookingUser?.name || bookingUser?.email || 'A user'} cancelled ${booking.class.name} on ${formattedDate} at ${booking.class.time}`,
              read: false
            }
          })
        )
      )

      // Check if there is anyone on the waitlist for this class
      const nextInWaitlist = await tx.waitlist.findFirst({
        where: { classId: booking.classId },
        orderBy: { position: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              packages: {
                where: {
                  active: true,
                  classesRemaining: { gt: 0 },
                  endDate: { gte: new Date() }
                },
                take: 1
              }
            }
          }
        }
      })

      // If there's someone on the waitlist and they have an active package
      if (nextInWaitlist && nextInWaitlist.user.packages.length > 0) {
        // Create a booking for the next person in waitlist
        const newBooking = await tx.booking.create({
          data: {
            userId: nextInWaitlist.userId,
            classId: booking.classId,
            status: "confirmed"
          }
        })

        // Increment current bookings (since we already decremented it)
        await tx.class.update({
          where: { id: booking.classId },
          data: { 
            currentBookings: {
              increment: 1
            }
          }
        })

        // Delete the waitlist entry
        await tx.waitlist.delete({
          where: { id: nextInWaitlist.id }
        })

        // Shift the remaining waitlist positions
        await tx.waitlist.updateMany({
          where: { 
            classId: booking.classId,
            position: { gt: nextInWaitlist.position } 
          },
          data: {
            position: { decrement: 1 }
          }
        })

        // Create a notification for the promoted user
        await tx.notification.create({
          data: {
            userId: nextInWaitlist.userId,
            type: "waitlist_promoted",
            message: `Great news! A spot opened up in ${booking.class.name} on ${new Date(booking.class.date).toLocaleDateString()} at ${booking.class.time}. You've been automatically moved from the waitlist to confirmed.`
          }
        })

        // Return info about the promotion
        return {
          cancelled: deletedBooking,
          promoted: {
            userId: nextInWaitlist.userId,
            userName: nextInWaitlist.user.name,
            bookingId: newBooking.id
          }
        }
      }

      // If no promotion happened, just return the cancelled booking
      return { 
        cancelled: deletedBooking,
        promoted: null
      }
    })

    return NextResponse.json({ 
      message: "Booking cancelled successfully",
      promotedFromWaitlist: result.promoted ? true : false,
      result
    })
  } catch (error) {
    console.error(`Error cancelling booking:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 