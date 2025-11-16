import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Get the user to verify they are an admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true }
    })

    if (adminUsers.length === 0) {
      return NextResponse.json(
        { error: "No admin users found" },
        { status: 404 }
      )
    }

    // Create test notifications for all admins
    const testMessages = [
      "John Smith cancelled CrossFit WOD on Mon, Nov 18 at 8:00 AM",
      "Sarah Johnson cancelled CrossFit HIIT on Tue, Nov 19 at 6:00 PM", 
      "Mike Davis cancelled CrossFit Strength on Wed, Nov 20 at 7:00 AM"
    ]

    let createdNotifications = 0

    for (const admin of adminUsers) {
      for (const message of testMessages) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'admin_cancellation',
            message: message,
            read: false
          }
        })
        createdNotifications++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdNotifications} test notifications`,
      details: {
        adminCount: adminUsers.length,
        notificationsPerAdmin: testMessages.length,
        totalNotifications: createdNotifications,
        testMessages: testMessages
      }
    })

  } catch (error) {
    console.error("Error creating test notifications:", error)
    
    // Handle JWT verification errors
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE method to clear all test notifications
export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Get the user to verify they are an admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      )
    }

    // Delete all notifications of type 'admin_cancellation'
    const deleteResult = await prisma.notification.deleteMany({
      where: { 
        type: 'admin_cancellation'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Cleared ${deleteResult.count} notifications`,
      deletedCount: deleteResult.count
    })

  } catch (error) {
    console.error("Error clearing test notifications:", error)
    
    // Handle JWT verification errors
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
