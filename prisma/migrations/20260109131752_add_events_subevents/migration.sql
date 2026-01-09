-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibleToRoles" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SubEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATETIME,
    "time" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibleToRoles" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'The Main Event',
    "locationName" TEXT NOT NULL,
    "locationAddress" TEXT,
    "vibe" TEXT NOT NULL,
    "isRsvpLocked" BOOLEAN NOT NULL DEFAULT false,
    "isDietEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dietTargetRoles" TEXT NOT NULL DEFAULT '',
    "isSongRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "songTargetRoles" TEXT NOT NULL DEFAULT '',
    "dinnerTitle" TEXT NOT NULL DEFAULT 'Private Dinner',
    "dinnerDescription" TEXT NOT NULL DEFAULT 'Please confirm if you will join us for the family dinner before the main event.',
    "afterPartyTitle" TEXT NOT NULL DEFAULT 'The Afterparty',
    "afterPartyDescription" TEXT NOT NULL DEFAULT 'Music & Drinks',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EventSettings" ("date", "id", "isRsvpLocked", "locationAddress", "locationName", "title", "updatedAt", "vibe") SELECT "date", "id", "isRsvpLocked", "locationAddress", "locationName", "title", "updatedAt", "vibe" FROM "EventSettings";
DROP TABLE "EventSettings";
ALTER TABLE "new_EventSettings" RENAME TO "EventSettings";
CREATE TABLE "new_Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GUEST',
    "diet" TEXT,
    "dietaryRestrictions" TEXT,
    "songRequest" TEXT,
    "tableNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
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
    CONSTRAINT "Guest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Guest" ("code", "createdAt", "diet", "id", "invitedById", "maxInvites", "name", "phone", "plusOneAllowed", "plusOneDiet", "plusOneName", "role", "rsvpAfterParty", "rsvpDinner", "rsvpMain", "songRequest", "updatedAt") SELECT "code", "createdAt", "diet", "id", "invitedById", "maxInvites", "name", "phone", "plusOneAllowed", "plusOneDiet", "plusOneName", "role", "rsvpAfterParty", "rsvpDinner", "rsvpMain", "songRequest", "updatedAt" FROM "Guest";
DROP TABLE "Guest";
ALTER TABLE "new_Guest" RENAME TO "Guest";
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
