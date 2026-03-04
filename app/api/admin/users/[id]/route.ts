import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetUserId = params.id;

    // Validate user exists
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Do not allow deleting self (admin safety)
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    // Transaction: delete related data then user
    await prisma.$transaction(async (tx) => {
      // Delete bookings
      await tx.booking.deleteMany({ where: { userId: targetUserId } });
      // Delete waitlist entries
      await tx.waitlist.deleteMany({ where: { userId: targetUserId } });
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: targetUserId } });
      // Find user's packages
      const userPackages = await tx.package.findMany({ where: { userId: targetUserId } });
      const packageIds = userPackages.map((p) => p.id);
      if (packageIds.length > 0) {
        // Delete package renewals referencing these packages
        await tx.packageRenewal.deleteMany({ where: { packageId: { in: packageIds } } });
        // Delete packages
        await tx.package.deleteMany({ where: { id: { in: packageIds } } });
      }
      // Also delete any package renewals directly tied to user (safety)
      await tx.packageRenewal.deleteMany({ where: { userId: targetUserId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: targetUserId } });
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully', userId: targetUserId });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
