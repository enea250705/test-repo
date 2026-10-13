import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { hoursUntilClass } from "@/lib/class-time"
import { sendEmail } from "@/lib/email"

// PUT cancel a booking
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Find the booking with class details
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    // Check if user has permission (is admin or booking owner)
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if cancellation is within the allowed time window (8 hours before class)
    const hoursBeforeClass = hoursUntilClass(booking.class.date, booking.class.time)

    if (hoursBeforeClass < 8) {
      return NextResponse.json({ 
        message: "Cancellation is only allowed at least 8 hours before the class" 
      }, { status: 400 })
    }

    // Use a transaction to update all related data
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status: "cancelled" }
      })

      // Update class current bookings
      await tx.class.update({
        where: { id: booking.classId },
        data: { currentBookings: { decrement: 1 } }
      })

      // Find user's active package
      const userPackage = await tx.package.findFirst({
        where: {
          userId: booking.userId,
          active: true
        }
      })

      if (userPackage) {
        // Increment remaining classes
        await tx.package.update({
          where: { id: userPackage.id },
          data: { classesRemaining: { increment: 1 } }
        })
      }

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
              message: `${booking.user.name || booking.user.email} cancelled ${booking.class.name} on ${formattedDate} at ${booking.class.time}`,
              read: false
            }
          })
        )
      )

      return updatedBooking
    })

    // Format class date for email
    const formattedDate = new Date(booking.class.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Send cancellation confirmation email
    await sendEmail({
      to: booking.user.email,
      subject: "Your GymXam Class Booking Has Been Cancelled",
      text: `
Dear ${booking.user.name},

Your booking for ${booking.class.name} on ${formattedDate} at ${booking.class.time} has been successfully cancelled.

A class credit has been returned to your account.

Thank you for using GymXam!

Best regards,
The GymXam Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Class Booking Cancelled</h2>
  
  <p>Dear ${booking.user.name},</p>
  
  <p>Your booking for <strong>${booking.class.name}</strong> on ${formattedDate} at ${booking.class.time} has been successfully cancelled.</p>
  
  <p>A class credit has been returned to your account.</p>
  
  <p>Thank you for using GymXam!</p>
  
  <p>Best regards,<br>
  The GymXam Team</p>
</div>
      `
    })

    return NextResponse.json({ 
      message: "Booking cancelled successfully",
      booking: updatedBooking
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
