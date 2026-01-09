'use server'

import { prisma } from '@/lib/db'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export async function updateEventSettings(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const dateStr = formData.get('date') as string
    const timeStr = formData.get('time') as string // HH:mm
    const locationName = formData.get('locationName') as string
    const locationAddress = formData.get('locationAddress') as string
    const vibe = formData.get('vibe') as string
    const dinnerTitle = formData.get('dinnerTitle') as string
    const dinnerDescription = formData.get('dinnerDescription') as string
    const afterPartyTitle = formData.get('afterPartyTitle') as string
    const afterPartyDescription = formData.get('afterPartyDescription') as string

    // Combine date and time
    const dateTime = new Date(`${dateStr}T${timeStr}:00`)

    try {
        await prisma.eventSettings.upsert({
            where: { id: 'default' },
            update: {
                title,
                date: dateTime,
                locationName,
                locationAddress,
                vibe,
                isRsvpLocked: formData.get('isRsvpLocked') === 'on',
                dinnerTitle,
                dinnerDescription,
                afterPartyTitle,
                afterPartyDescription
            },
            create: {
                id: 'default',
                title,
                date: dateTime,
                locationName,
                locationAddress,
                vibe,
                isRsvpLocked: formData.get('isRsvpLocked') === 'on',
                dinnerTitle,
                dinnerDescription,
                afterPartyTitle,
                afterPartyDescription
            }
        })
        revalidatePath('/')
        revalidatePath('/dashboard')
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to update settings' }
    }
}

export async function addTimelineItem(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const time = formData.get('time') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string) || 99

    // Build visibleTo from group checkboxes
    const groups: string[] = []
    if (formData.get('group_ALL') === 'on') groups.push('ALL')
    if (formData.get('group_FAMILY') === 'on') groups.push('FAMILY')
    if (formData.get('group_FRIEND') === 'on') groups.push('FRIEND')
    if (formData.get('group_VIP') === 'on') groups.push('VIP')
    const visibleTo = groups.length > 0 ? groups.join(',') : 'ALL'

    try {
        await prisma.timelineItem.create({
            data: {
                time,
                title,
                description,
                order,
                visibleTo
            }
        })
        revalidatePath('/dashboard')
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: 'Failed' }
    }
}

export async function deleteTimelineItem(id: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    try {
        await prisma.timelineItem.delete({ where: { id } })
        revalidatePath('/dashboard')
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: 'Failed' }
    }
}

export async function updateTimelineItem(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const time = formData.get('time') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const order = parseInt(formData.get('order') as string) || 99

    // Build visibleTo from group checkboxes
    const groups: string[] = []
    if (formData.get('group_ALL') === 'on') groups.push('ALL')
    if (formData.get('group_FAMILY') === 'on') groups.push('FAMILY')
    if (formData.get('group_FRIEND') === 'on') groups.push('FRIEND')
    if (formData.get('group_VIP') === 'on') groups.push('VIP')
    const visibleTo = groups.length > 0 ? groups.join(',') : 'ALL'

    try {
        await prisma.timelineItem.update({
            where: { id },
            data: {
                time,
                title,
                description,
                order,
                visibleTo
            }
        })
        revalidatePath('/dashboard')
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: 'Failed to update' }
    }
}
