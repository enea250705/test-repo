/*
  Warnings:

  - You are about to drop the column `bookingDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `classesPerMonth` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `durationDays` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,classId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_classId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_packageId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- FIRST: Create temporary columns for existing data
ALTER TABLE "Package" ADD COLUMN "temp_userId" TEXT;
ALTER TABLE "Package" ADD COLUMN "temp_totalClasses" INTEGER;
ALTER TABLE "Package" ADD COLUMN "temp_classesRemaining" INTEGER;
ALTER TABLE "Package" ADD COLUMN "temp_startDate" TIMESTAMP(3);
ALTER TABLE "Package" ADD COLUMN "temp_endDate" TIMESTAMP(3);
ALTER TABLE "Package" ADD COLUMN "temp_active" BOOLEAN DEFAULT true;

-- NEXT: Set default values for existing packages
UPDATE "Package" 
SET 
  "temp_userId" = (SELECT id FROM "User" WHERE "role" = 'admin' LIMIT 1),
  "temp_totalClasses" = 8,
  "temp_classesRemaining" = 8,
  "temp_startDate" = NOW(),
  "temp_endDate" = NOW() + INTERVAL '30 days',
  "temp_active" = true;

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "bookingDate",
DROP COLUMN "status",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Class" ALTER COLUMN "capacity" SET DEFAULT 15;

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "classesPerMonth",
DROP COLUMN "durationDays",
DROP COLUMN "price",
DROP COLUMN "updatedAt";

-- NOW: Add the required columns using data from temp columns
ALTER TABLE "Package" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Package" ADD COLUMN "totalClasses" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Package" ADD COLUMN "classesRemaining" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Package" ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "Package" ADD COLUMN "endDate" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "Package" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Update the real columns from temp columns
UPDATE "Package" 
SET 
  "userId" = "temp_userId",
  "totalClasses" = "temp_totalClasses",
  "classesRemaining" = "temp_classesRemaining",
  "startDate" = "temp_startDate",
  "endDate" = "temp_endDate",
  "active" = "temp_active";

-- Remove temp columns
ALTER TABLE "Package" DROP COLUMN "temp_userId";
ALTER TABLE "Package" DROP COLUMN "temp_totalClasses";
ALTER TABLE "Package" DROP COLUMN "temp_classesRemaining";
ALTER TABLE "Package" DROP COLUMN "temp_startDate";
ALTER TABLE "Package" DROP COLUMN "temp_endDate";
ALTER TABLE "Package" DROP COLUMN "temp_active";

-- Remove the defaults from the columns
ALTER TABLE "Package" ALTER COLUMN "userId" DROP DEFAULT;
ALTER TABLE "Package" ALTER COLUMN "totalClasses" DROP DEFAULT;
ALTER TABLE "Package" ALTER COLUMN "classesRemaining" DROP DEFAULT;
ALTER TABLE "Package" ALTER COLUMN "startDate" DROP DEFAULT;
ALTER TABLE "Package" ALTER COLUMN "endDate" DROP DEFAULT;

-- DropTable
DROP TABLE "Subscription";

-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_classId_key" ON "Booking"("userId", "classId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
