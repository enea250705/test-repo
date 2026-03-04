-- CreateTable
CREATE TABLE "booking_cancellations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "originalBookingId" TEXT,
    "reason" TEXT,
    "cancelledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hoursBeforeClass" DOUBLE PRECISION,

    CONSTRAINT "booking_cancellations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "booking_cancellations" ADD CONSTRAINT "booking_cancellations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_cancellations" ADD CONSTRAINT "booking_cancellations_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
