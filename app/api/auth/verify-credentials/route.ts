import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for validation
const credentialCheckSchema = z.object({
  // Trim before validating, same as the login route.
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: Request) {
  try {
    console.log("Credential verification API called");
    
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
    const result = credentialCheckSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation failed:", result.error.errors[0].message);
      return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    }
    
    const { email: rawEmail, password } = result.data;
    const email = rawEmail.trim().toLowerCase();
    
    // Find user by email (case-insensitive, same as the login route)
    let user;
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } }
      });
      console.log("User lookup result:", user ? "User found" : "User not found");
    } catch (dbError) {
      console.error("Database error during user lookup:", dbError);
      return NextResponse.json({ message: "Database error", error: String(dbError) }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        message: "User not found", 
        email,
        userExists: false 
      }, { status: 200 });
    }
    
    // Verify password
    let passwordMatch;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password match:", passwordMatch);
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return NextResponse.json({ message: "Password comparison error", error: String(bcryptError) }, { status: 500 });
    }
    
    return NextResponse.json({
      userExists: true,
      passwordMatch,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        approved: user.approved
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error("Credential verification error:", error);
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 });
  }
} 
 
 
 