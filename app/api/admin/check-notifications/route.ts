import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all notifications
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get admin users
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true }
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { read: false }
    })

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications,
        adminUsers: admins,
        unreadCount: unreadCount,
        totalNotifications: notifications.length
      }
    })

  } catch (error) {
    console.error("Error checking notifications:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    )
  }
}
