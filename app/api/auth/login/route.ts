import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for validation
const loginSchema = z.object({
  // Trim before validating: mobile keyboards and autofill often append a space.
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
  try {
    console.log("Login API route called");
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed:", { email: body.email });
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation failed:", result.error.errors[0].message);
      return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    }
    
    const { email: rawEmail, password } = result.data;
    // Normalize the email so stray whitespace or capitals from mobile keyboards
    // and copy-paste do not turn a valid account into "user not found".
    const email = rawEmail.trim().toLowerCase();
    
    // Find user by email (case-insensitive, to match accounts stored with any casing)
    let user;
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } }
      });
      console.log("User lookup result:", user ? "User found" : "User not found");
    } catch (dbError) {
      console.error("Database error during user lookup:", dbError);
      return NextResponse.json({ message: "Database error" }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }
    
    // Check if user is approved
    if (!user.approved && user.role !== "admin") {
      console.log("User not approved:", email);
      return NextResponse.json({ message: "Your account is pending approval by an administrator" }, { status: 403 });
    }
    
    // Verify password
    let passwordMatch;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password match:", passwordMatch);
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return NextResponse.json({ message: "Authentication error" }, { status: 500 });
    }
    
    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }
    
    // Generate JWT
    let token;
    try {
      // Match the specific token structure provided by the user
      token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          // Add timestamp for issued at time
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET || 'fallback_secret_for_development',
        { 
          expiresIn: "365d", // Set to 1 year for long-term persistence
          algorithm: "HS256" // Explicitly set the algorithm
        }
      );
      console.log("JWT generated successfully");
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError);
      return NextResponse.json({ message: "Authentication error" }, { status: 500 });
    }
    
    // Set JWT as HTTP-only cookie with extended expiration (30 days) for persistent login
    const response = NextResponse.json(
      { 
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token 
      }, 
      { status: 200 }
    );
    
    // Set auth token in cookie with optimized settings for persistence
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true, // Set to true for security - prevents JavaScript access
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // More restrictive setting for better security
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 365 days (1 year) for persistent login
    });
    
    // Set a secondary cookie as backup
    response.cookies.set({
      name: "auth_session",
      value: user.id,
      httpOnly: false, // Set to false to allow JS access for debugging
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 365 days (1 year)
    });
    
    // Log cookie details for debugging
    console.log("Setting cookies with the following details:", {
      authToken: {
        value: token.substring(0, 20) + "...",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      },
      authSession: {
        value: user.id,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      }
    });
    
    console.log("Login successful, returning response");
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
