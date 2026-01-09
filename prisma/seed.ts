import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Admin
    const admin = await prisma.guest.upsert({
        where: { code: 'ADMINX' },
        update: {},
        create: {
            name: 'Pysiek (Host)',
            code: 'ADMINX',
            role: 'ADMIN',
            maxInvites: 100
        }
    })

    // Family
    const family = await prisma.guest.upsert({
        where: { code: 'MOMDAD' },
        update: {},
        create: {
            name: 'Mom & Dad',
            code: 'MOMDAD',
            role: 'FAMILY',
            maxInvites: 2
        } // Ensure this bracket closes create
    }) // Ensure this bracket closes upsert

    // VIP
    const vip = await prisma.guest.upsert({
        where: { code: 'BESTIE' },
        update: {},
        create: {
            name: 'Best Friend',
            code: 'BESTIE',
            role: 'VIP',
            maxInvites: 2
        }
    })

    // Event Settings
    await prisma.eventSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            date: new Date('2026-01-16T18:00:00'),
            title: '16.01.26',
            locationName: 'Warsaw Spire, Level 42',
            locationAddress: 'Plac Europejski 1, Warsaw',
            vibe: 'Black Tie Optional'
        }
    })

    // Timeline
    const timelineItems = [
        { time: '18:00', title: 'Welcome', description: 'Cocktails & Jazz', order: 1, visibleTo: 'ALL' },
        { time: '19:00', title: 'Family Dinner', description: 'Private Dining Room', order: 2, visibleTo: 'FAMILY' },
        { time: '21:00', title: 'The Party', description: 'Music & Drinks', order: 3, visibleTo: 'ALL' },
        { time: '02:00', title: 'After Party', description: 'Secret Location', order: 4, visibleTo: 'ALL' },
    ]

    for (const item of timelineItems) {
        // Basic check to see if it exists by title+time to avoid dups on re-runs (simple approach)
        const exists = await prisma.timelineItem.findFirst({ where: { title: item.title } })
        if (!exists) {
            await prisma.timelineItem.create({ data: item })
        }
    }

    console.log({ admin, family, vip })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
