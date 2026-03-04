import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// Function to calculate days remaining
function calculateDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// POST - Send a reminder to a client about expiring package
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clientId = params.id;
    
    // Get client with their active package
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
      },
      include: {
        packages: {
          where: {
            active: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if client has an active package
    if (!client.packages || client.packages.length === 0) {
      return NextResponse.json(
        { error: "Client does not have an active package" },
        { status: 400 }
      );
    }

    const activePackage = client.packages[0];
    const daysRemaining = calculateDaysRemaining(activePackage.endDate);

    // Check if package is actually expiring soon
    if (daysRemaining > 7) {
      return NextResponse.json(
        { error: "Package is not expiring soon (more than 7 days remaining)" },
        { status: 400 }
      );
    }

    // Send reminder email
    try {
      await sendEmail({
        to: client.email,
        subject: "Your Membership Package is Expiring Soon",
        text: `
          Hello ${client.name},

          This is a friendly reminder that your membership package is expiring soon:

          Package: ${activePackage.name}
          Classes Remaining: ${activePackage.classesRemaining} of ${activePackage.totalClasses}
          Days Remaining: ${daysRemaining}
          Expiration Date: ${activePackage.endDate.toLocaleDateString()}

          To continue enjoying our fitness classes, please consider renewing your membership before it expires.
          You can renew your membership by visiting our website or speaking with our staff.

          Thank you for being a valued member of GymXam.

          Best regards,
          The GymXam Team
        `,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Your Membership Package is Expiring Soon</h2>
            <p>Hello ${client.name},</p>
            <p>This is a friendly reminder that your membership package is expiring soon:</p>
            <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Package:</strong> ${activePackage.name}</p>
              <p><strong>Classes Remaining:</strong> ${activePackage.classesRemaining} of ${activePackage.totalClasses}</p>
              <p><strong>Days Remaining:</strong> ${daysRemaining}</p>
              <p><strong>Expiration Date:</strong> ${activePackage.endDate.toLocaleDateString()}</p>
            </div>
            <p>To continue enjoying our fitness classes, please consider renewing your membership before it expires.</p>
            <p>You can renew your membership by visiting our website or speaking with our staff.</p>
            <p>Thank you for being a valued member of GymXam.</p>
            <p>Best regards,<br>The GymXam Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Error sending reminder email:", emailError);
      return NextResponse.json(
        { error: "Failed to send reminder email" },
        { status: 500 }
      );
    }

    // Record that a reminder was sent
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: "package_expiry",
        message: `Reminder sent for package expiring in ${daysRemaining} days`,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending package reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
} 