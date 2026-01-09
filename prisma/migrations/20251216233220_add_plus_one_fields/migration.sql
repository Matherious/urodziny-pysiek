-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guest" (
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
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT true,
    "plusOneName" TEXT,
    "plusOneDiet" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Guest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("code", "createdAt", "diet", "id", "invitedById", "maxInvites", "name", "role", "rsvpAfterParty", "rsvpDinner", "rsvpMain", "songRequest", "updatedAt") SELECT "code", "createdAt", "diet", "id", "invitedById", "maxInvites", "name", "role", "rsvpAfterParty", "rsvpDinner", "rsvpMain", "songRequest", "updatedAt" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
