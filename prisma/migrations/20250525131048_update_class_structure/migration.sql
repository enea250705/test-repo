/*
  Warnings:

  - You are about to drop the column `endTime` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `instructor` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Class` table. All the data in the column will be lost.
  - Added the required column `date` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Class" DROP COLUMN "endTime",
DROP COLUMN "instructor",
DROP COLUMN "location",
DROP COLUMN "startTime",
ADD COLUMN     "currentBookings" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "day" TEXT NOT NULL,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'Cash',
ADD COLUMN     "time" TEXT NOT NULL,
ALTER COLUMN "capacity" SET DEFAULT 15;
