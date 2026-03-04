/*
  Warnings:

  - You are about to drop the `booking_cancellations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "booking_cancellations" DROP CONSTRAINT "booking_cancellations_classId_fkey";

-- DropForeignKey
ALTER TABLE "booking_cancellations" DROP CONSTRAINT "booking_cancellations_userId_fkey";

-- DropTable
DROP TABLE "booking_cancellations";

-- CreateTable
CREATE TABLE "PackageRenewal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "renewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION DEFAULT 0,
    "method" TEXT NOT NULL DEFAULT 'renewal',

    CONSTRAINT "PackageRenewal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PackageRenewal" ADD CONSTRAINT "PackageRenewal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageRenewal" ADD CONSTRAINT "PackageRenewal_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
