import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { calculatePackagePeriod } from "@/lib/package-dates"

// Schema for validation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  // Trim before validating: mobile keyboards and autofill often append a space.
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  packageType: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 })
    }

    const { name, email: rawEmail, password, packageType } = result.data
    // Store emails normalized so login lookups always match what the user types.
    const email = rawEmail.trim().toLowerCase()
    
    // Check if user already exists (case-insensitive, to avoid duplicate accounts)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } }
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
      name,
      email,
        password: hashedPassword,
      role: "user",
        approved: false,
      }
    })

    // Create notification for admins about new user registration
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "registration",
        message: `New user registered: ${name} (${email}). Waiting for approval.`,
      }
    })
    
    // Create package for the new user based on selected package type
    let userPackage = null;
    if (packageType) {
      try {
        console.log(`Creating package for new user ${user.email} with package type: ${packageType}`);
        
        // Define package types
        const packageTypes: Record<string, { name: string; totalClasses: number }> = {
          "8": { name: "8 CrossFit Classes / Month", totalClasses: 8 },
          "12": { name: "12 CrossFit Classes / Month", totalClasses: 12 },
        };
        
        if (packageType in packageTypes) {
          const packageDetails = packageTypes[packageType];
          
          // Calculate start and end dates
          const { startDate, endDate } = calculatePackagePeriod();
          
          // Create the new package
          userPackage = await prisma.package.create({
            data: {
              userId: user.id,
              name: packageDetails.name,
              totalClasses: packageDetails.totalClasses,
              classesRemaining: packageDetails.totalClasses,
              startDate,
              endDate,
              active: true,
            },
          });
          
          console.log(`Successfully created package ID: ${userPackage.id} for new user: ${user.email}`);
        } else {
          console.warn(`Unknown package type: ${packageType} for user ${user.email}`);
        }
      } catch (packageError) {
        console.error(`ERROR creating package for user ${user.email}:`, packageError);
        // Continue with registration even if package creation fails
      }
    }
    
    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback_secret_for_development',
      { expiresIn: "30d" }
    )
    
    // Set JWT as HTTP-only cookie with 30-day expiration for persistent login
    const response = NextResponse.json(
      { 
        message: "Registration successful. Your account is pending approval by an administrator.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        package: userPackage
      }, 
      { status: 201 }
    )
    
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days for persistent login
    })
    
    return response
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
