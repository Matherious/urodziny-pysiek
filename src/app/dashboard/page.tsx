import { getSession } from '../actions/auth'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
    const guest = await getSession()

    if (!guest) {
        redirect('/')
    }

    // Re-fetch guest to get relations
    const fullGuest = await prisma.guest.findUnique({
        where: { id: guest.id },
        include: { invitees: true }
    })

    if (!fullGuest) {
        redirect('/')
    }

    const settings = await prisma.eventSettings.findUnique({ where: { id: 'default' } })
    const timeline = await prisma.timelineItem.findMany({
        orderBy: { order: 'asc' },
    })

    // Fetch events with subevents
    const events = await prisma.event.findMany({
        include: { subEvents: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' }
    })

    // Filter timeline items based on visibility
    const filteredTimeline = timeline.filter(item => {
        const visibleGroups = item.visibleTo.split(',')
        return visibleGroups.includes('ALL') ||
            visibleGroups.includes(fullGuest.role) ||
            fullGuest.role === 'ADMIN'
    })

    // Filter events based on role visibility
    const filteredEvents = events.filter(event => {
        const roles = event.visibleToRoles.split(',')
        return roles.includes('ALL') ||
            roles.includes(fullGuest.role) ||
            fullGuest.role === 'ADMIN'
    })

    return (
        <main className="min-h-screen bg-background">
            <DashboardClient guest={fullGuest} settings={settings} timeline={filteredTimeline} events={filteredEvents} />
        </main>
    )
}
