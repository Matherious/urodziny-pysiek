-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "date" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineItem" (
    "id" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibleTo" TEXT NOT NULL DEFAULT 'ALL',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibleToRoles" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "time" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visibleToRoles" TEXT NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_code_key" ON "Guest"("code");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubEvent" ADD CONSTRAINT "SubEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
