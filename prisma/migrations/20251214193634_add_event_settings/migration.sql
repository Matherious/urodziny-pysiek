-- CreateTable
CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'The Main Event',
    "locationName" TEXT NOT NULL,
    "locationAddress" TEXT,
    "vibe" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFamilyOnly" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
