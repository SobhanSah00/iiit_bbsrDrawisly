-- CreateTable
CREATE TABLE "SessionRecording" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionRecording_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SessionRecording" ADD CONSTRAINT "SessionRecording_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
