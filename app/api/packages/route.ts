import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";
import { calculatePackagePeriod } from "@/lib/package-dates";

// GET user's active package
export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log(`Fetching active package for user: ${user.email}`);
    
    // Find the user's active package
    const userPackage = await prisma.package.findFirst({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        endDate: "desc",
      },
    });
    
    if (!userPackage) {
      console.log(`No active package found for user: ${user.email}`);
      return NextResponse.json({ package: null }, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(userPackage.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    console.log(`Found active package for user ${user.email}: ${userPackage.name}, ${userPackage.classesRemaining}/${userPackage.totalClasses} classes remaining`);
    
    return NextResponse.json({
      package: {
        ...userPackage,
        daysRemaining,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error fetching user package:", error);
    return NextResponse.json(
      { error: "Failed to fetch user package" },
      { status: 500 }
    );
  }
}

// POST - Create a new package (purchase/renewal)
export async function POST(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { packageType } = await request.json();
    console.log(`Creating package of type: ${packageType} for user: ${user.email}`);
    
    // Define package types
    const packageTypes: Record<string, { name: string; totalClasses: number; price: number }> = {
      "8": { name: "8 CrossFit Classes / Month", totalClasses: 8, price: 120 },
      "12": { name: "12 CrossFit Classes / Month", totalClasses: 12, price: 160 }
    };
    
    if (!packageType || !(packageType in packageTypes)) {
      return NextResponse.json(
        { error: "Invalid package type" },
        { status: 400 }
      );
    }
    
    // Get the current active package if any
    const currentPackage = await prisma.package.findFirst({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        endDate: "desc",
      },
    });
    
    const packageDetails = packageTypes[packageType];
    
    // Packages run ~4 weeks ending on a Saturday. If the current package is still
    // valid, the new one starts right after it ends.
    const { startDate, endDate } = calculatePackagePeriod(currentPackage?.endDate);
    
    // First, deactivate any existing active packages for this user
    await prisma.package.updateMany({
      where: {
        userId: user.id,
        active: true,
      },
      data: {
        active: false,
      },
    });
    
    // Create the new package
    const newPackage = await prisma.package.create({
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
    
    // Track the renewal in PackageRenewal table
    await prisma.packageRenewal.create({
      data: {
        userId: user.id,
        packageId: newPackage.id,
        packageType: packageType,
        packageName: packageDetails.name,
        startDate,
        endDate,
        price: packageDetails.price,
        method: currentPackage ? "renewal" : "purchase",
      },
    });
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    console.log(`Successfully created package ${newPackage.id} for user ${user.email}`);
    
    // Verify the package was created correctly
    const verifyPackage = await prisma.package.findUnique({
      where: { id: newPackage.id }
    });
    
    if (!verifyPackage) {
      throw new Error("Package verification failed after creation");
    }
    
    console.log(`Package verified successfully: ${verifyPackage.name} with ${verifyPackage.classesRemaining} classes`);
    
    return NextResponse.json({
      package: {
        ...newPackage,
        daysRemaining,
      },
      message: currentPackage ? "Package renewed successfully" : "Package purchased successfully",
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error creating user package:", error);
    return NextResponse.json(
      { error: "Failed to create user package" },
      { status: 500 }
    );
  }
} 