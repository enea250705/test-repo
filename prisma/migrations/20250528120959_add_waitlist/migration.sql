-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_userId_classId_key" ON "Waitlist"("userId", "classId");

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
