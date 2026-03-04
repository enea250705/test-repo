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

    // Notification has no onDelete: Cascade in schema, so must be deleted manually first.
    // All other relations (Booking, Waitlist, Package, PackageRenewal) have onDelete: Cascade
    // on their User foreign keys, so they are removed automatically when the user is deleted.
    await prisma.notification.deleteMany({ where: { userId: targetUserId } });
    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ success: true, message: 'User deleted successfully', userId: targetUserId });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
