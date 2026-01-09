'use server';

import { prisma } from '@/lib/db';
// import { Role } from '@prisma/client';

export async function getDashboardStats() {
    const guests = await prisma.guest.findMany();

    const totalGuests = guests.length;
    const confirmedGuests = guests.filter(g => g.rsvpMain).length;
    const confirmedDinner = guests.filter(g => g.rsvpDinner).length;
    const confirmedAfterParty = guests.filter(g => g.rsvpAfterParty).length;

    // Breakdown by Role
    const roleBreakdown = guests.reduce((acc, guest) => {
        const role = guest.role || 'GUEST';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Dietary Restrictions
    const dietaryRestrictions = guests
        .filter(g => g.dietaryRestrictions)
        .map(g => ({ name: g.name, diet: g.dietaryRestrictions }));

    return {
        totalGuests,
        confirmedGuests,
        confirmedDinner,
        confirmedAfterParty,
        roleBreakdown,
        dietaryRestrictions,
    };
}

export async function exportGuestsAsCSV() {
    const guests = await prisma.guest.findMany();

    const headers = ['Name', 'Code', 'Role', 'RSVP Main', 'RSVP Dinner', 'Diet', 'Song Request', 'Plus One'];
    const rows = guests.map(g => [
        g.name,
        g.code,
        g.role,
        g.rsvpMain ? 'Yes' : 'No',
        g.rsvpDinner ? 'Yes' : 'No',
        g.dietaryRestrictions || '',
        g.songRequest || '',
        g.plusOneName || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
}
