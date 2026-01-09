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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EventSettings" ("date", "id", "locationAddress", "locationName", "title", "updatedAt", "vibe") SELECT "date", "id", "locationAddress", "locationName", "title", "updatedAt", "vibe" FROM "EventSettings";
DROP TABLE "EventSettings";
ALTER TABLE "new_EventSettings" RENAME TO "EventSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
