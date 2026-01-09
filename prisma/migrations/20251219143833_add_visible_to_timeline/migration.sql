/*
  Warnings:

  - You are about to drop the column `isFamilyOnly` on the `TimelineItem` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimelineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibleTo" TEXT NOT NULL DEFAULT 'ALL',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TimelineItem" ("description", "id", "order", "time", "title", "updatedAt") SELECT "description", "id", "order", "time", "title", "updatedAt" FROM "TimelineItem";
DROP TABLE "TimelineItem";
ALTER TABLE "new_TimelineItem" RENAME TO "TimelineItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
