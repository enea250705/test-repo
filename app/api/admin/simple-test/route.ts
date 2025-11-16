import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true }
    })

    if (adminUsers.length === 0) {
      return NextResponse.json({
        error: "No admin users found in database"
      }, { status: 404 })
    }

    // Create one simple test notification for each admin
    const testMessage = `TEST: Client cancelled CrossFit class on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`

    let created = 0
    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'admin_cancellation',
          message: testMessage,
          read: false
        }
      })
      created++
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} test notifications`,
      testMessage: testMessage,
      adminCount: adminUsers.length
    })

  } catch (error) {
    console.error("Error creating simple test:", error)
    return NextResponse.json(
      { error: "Error creating test notification", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Delete all test notifications
    const result = await prisma.notification.deleteMany({
      where: {
        message: { contains: 'TEST:' }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} test notifications`,
      deletedCount: result.count
    })

  } catch (error) {
    console.error("Error deleting test notifications:", error)
    return NextResponse.json(
      { error: "Error deleting test notifications", details: error.message },
      { status: 500 }
    )
  }
}
