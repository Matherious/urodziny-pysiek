-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "diet" TEXT,
    "songRequest" TEXT,
    "invitedById" TEXT,
    "maxInvites" INTEGER NOT NULL DEFAULT 0,
    "rsvpMain" BOOLEAN NOT NULL DEFAULT false,
    "rsvpDinner" BOOLEAN NOT NULL DEFAULT false,
    "rsvpAfterParty" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code");
