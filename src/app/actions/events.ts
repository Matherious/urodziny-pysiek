'use server'

import { prisma } from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

// === EVENT CRUD ===

export async function createEvent(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const dateStr = formData.get('date') as string
    const time = formData.get('time') as string
    const locationName = formData.get('locationName') as string
    const locationAddress = formData.get('locationAddress') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string) || 0

    // Build visibleToRoles from checkboxes
    const roles: string[] = []
    if (formData.get('role_ALL') === 'on') roles.push('ALL')
    if (formData.get('role_FAMILY') === 'on') roles.push('FAMILY')
    if (formData.get('role_FRIEND') === 'on') roles.push('FRIEND')
    if (formData.get('role_VIP') === 'on') roles.push('VIP')
    if (formData.get('role_GUEST') === 'on') roles.push('GUEST')
    const visibleToRoles = roles.length > 0 ? roles.join(',') : 'ALL'

    if (!title || !dateStr) {
        return { error: 'Title and date are required' }
    }

    try {
        const date = new Date(dateStr)
        await prisma.event.create({
            data: {
                title,
                date,
                time: time || null,
                locationName: locationName || null,
                locationAddress: locationAddress || null,
                description: description || null,
                order,
                visibleToRoles
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error('Create event error:', e)
        return { error: 'Failed to create event' }
    }
}

export async function updateEvent(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const dateStr = formData.get('date') as string
    const time = formData.get('time') as string
    const locationName = formData.get('locationName') as string
    const locationAddress = formData.get('locationAddress') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string) || 0

    const roles: string[] = []
    if (formData.get('role_ALL') === 'on') roles.push('ALL')
    if (formData.get('role_FAMILY') === 'on') roles.push('FAMILY')
    if (formData.get('role_FRIEND') === 'on') roles.push('FRIEND')
    if (formData.get('role_VIP') === 'on') roles.push('VIP')
    if (formData.get('role_GUEST') === 'on') roles.push('GUEST')
    const visibleToRoles = roles.length > 0 ? roles.join(',') : 'ALL'

    if (!id || !title || !dateStr) {
        return { error: 'ID, title and date are required' }
    }

    try {
        const date = new Date(dateStr)
        await prisma.event.update({
            where: { id },
            data: {
                title,
                date,
                time: time || null,
                locationName: locationName || null,
                locationAddress: locationAddress || null,
                description: description || null,
                order,
                visibleToRoles
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error('Update event error:', e)
        return { error: 'Failed to update event' }
    }
}

export async function deleteEvent(id: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    try {
        await prisma.event.delete({ where: { id } })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error('Delete event error:', e)
        return { error: 'Failed to delete event' }
    }
}

// === SUBEVENT CRUD ===

export async function createSubEvent(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const eventId = formData.get('eventId') as string
    const title = formData.get('title') as string
    const dateStr = formData.get('date') as string
    const time = formData.get('time') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string) || 0

    const roles: string[] = []
    if (formData.get('role_ALL') === 'on') roles.push('ALL')
    if (formData.get('role_FAMILY') === 'on') roles.push('FAMILY')
    if (formData.get('role_FRIEND') === 'on') roles.push('FRIEND')
    if (formData.get('role_VIP') === 'on') roles.push('VIP')
    if (formData.get('role_GUEST') === 'on') roles.push('GUEST')
    const visibleToRoles = roles.length > 0 ? roles.join(',') : 'ALL'

    if (!eventId || !title) {
        return { error: 'Event ID and title are required' }
    }

    try {
        await prisma.subEvent.create({
            data: {
                eventId,
                title,
                date: dateStr ? new Date(dateStr) : null,
                time: time || null,
                description: description || null,
                order,
                visibleToRoles
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error('Create subevent error:', e)
        return { error: 'Failed to create sub-event' }
    }
}

export async function updateSubEvent(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const dateStr = formData.get('date') as string
    const time = formData.get('time') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string) || 0

    const roles: string[] = []
    if (formData.get('role_ALL') === 'on') roles.push('ALL')
    if (formData.get('role_FAMILY') === 'on') roles.push('FAMILY')
    if (formData.get('role_FRIEND') === 'on') roles.push('FRIEND')
    if (formData.get('role_VIP') === 'on') roles.push('VIP')
    if (formData.get('role_GUEST') === 'on') roles.push('GUEST')
    const visibleToRoles = roles.length > 0 ? roles.join(',') : 'ALL'

    if (!id || !title) {
        return { error: 'ID and title are required' }
    }

    try {
        await prisma.subEvent.update({
            where: { id },
            data: {
                title,
                date: dateStr ? new Date(dateStr) : null,
                time: time || null,
                description: description || null,
                order,
                visibleToRoles
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error('Update subevent error:', e)
        return { error: 'Failed to update sub-event' }
    }
}

export async function deleteSubEvent(id: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    try {
        await prisma.subEvent.delete({ where: { id } })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error('Delete subevent error:', e)
        return { error: 'Failed to delete sub-event' }
    }
}

// === FETCH EVENTS ===

export async function getEvents() {
    return prisma.event.findMany({
        include: { subEvents: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' }
    })
}
