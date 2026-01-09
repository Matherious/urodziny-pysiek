import { getSession } from '../actions/auth'
import { redirect } from 'next/navigation'
import { AdminClient } from './admin-client'
import { prisma } from '@/lib/db'

export default async function AdminPage() {
    const session = await getSession()

    if (!session || session.role !== 'ADMIN') {
        redirect('/')
    }

    const guests = await prisma.guest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            invitees: true,
            invitedBy: true
        }
    })

    // Fetch settings
    const settings = await prisma.eventSettings.findUnique({ where: { id: 'default' } })
    const timeline = await prisma.timelineItem.findMany({ orderBy: { order: 'asc' } })

    // Fetch events with subevents
    const events = await prisma.event.findMany({
        orderBy: { order: 'asc' },
        include: { subEvents: { orderBy: { order: 'asc' } } }
    })

    // Calculate stats
    const stats = {
        total: guests.length,
        main: guests.filter(g => g.rsvpMain).length,
        dinner: guests.filter(g => g.rsvpDinner).length,
        afterParty: guests.filter(g => g.rsvpAfterParty).length
    }

    return (
        <main className="min-h-screen bg-background p-8">
            <AdminClient guests={guests} stats={stats} settings={settings} timeline={timeline} events={events} />
        </main>
    )
}

