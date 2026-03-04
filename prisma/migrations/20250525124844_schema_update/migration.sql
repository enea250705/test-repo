/*
  Warnings:

  - You are about to drop the column `currentBookings` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `day` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Class` table. All the data in the column will be lost.
  - The `price` column on the `Class` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructor` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Booking_userId_classId_key";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "currentBookings",
DROP COLUMN "date",
DROP COLUMN "day",
DROP COLUMN "enabled",
DROP COLUMN "time",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "instructor" TEXT NOT NULL,
ADD COLUMN     "location" TEXT NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "capacity" DROP DEFAULT,
DROP COLUMN "price",
ADD COLUMN     "price" DOUBLE PRECISION DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "name" DROP NOT NULL;
