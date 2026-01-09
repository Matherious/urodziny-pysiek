'use server'

import { prisma } from '@/lib/db'
import { getSession } from './auth'
import { sendSMS } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'

// === SMS TYPES & ACTION ===

type SendSMSPayload = {
    message: string
    target: 'ALL' | 'GROUP' | 'SELECTED' | 'GUESTS_OF_ROLE'
    filter?: string | string[] // Role (e.g., 'FAMILY') or Array of IDs
}

export type SMSResult = {
    success: boolean
    sent: number
    failed: number
    error?: string
}

export async function sendBulkSMS({ message, target, filter }: SendSMSPayload): Promise<SMSResult> {
    const session = await getSession()

    // Security check: Only ADMIN can send bulk SMS
    if (!session || session.role !== 'ADMIN') {
        return { success: false, sent: 0, failed: 0, error: 'Unauthorized' }
    }

    if (!message || message.length < 2) {
        return { success: false, sent: 0, failed: 0, error: 'Message too short' }
    }

    // Determine recipients
    let guests: { id: string; name: string; phone: string | null; code: string; invitedBy: { name: string } | null }[] = []

    try {
        if (target === 'ALL') {
            guests = await prisma.guest.findMany({
                select: { id: true, name: true, phone: true, code: true, invitedBy: { select: { name: true } } }
            })
        } else if (target === 'GROUP' && typeof filter === 'string') {
            guests = await prisma.guest.findMany({
                where: { role: filter },
                select: { id: true, name: true, phone: true, code: true, invitedBy: { select: { name: true } } }
            })
        } else if (target === 'SELECTED' && Array.isArray(filter)) {
            guests = await prisma.guest.findMany({
                where: { id: { in: filter } },
                select: { id: true, name: true, phone: true, code: true, invitedBy: { select: { name: true } } }
            })
        } else if (target === 'GUESTS_OF_ROLE' && typeof filter === 'string') {
            // Find guests invited by users with specific role (e.g. VIP)
            guests = await prisma.guest.findMany({
                where: { invitedBy: { role: filter } },
                select: { id: true, name: true, phone: true, code: true, invitedBy: { select: { name: true } } }
            })
        }

        if (guests.length === 0) {
            return { success: false, sent: 0, failed: 0, error: 'No recipients found' }
        }

        let sentCount = 0
        let failedCount = 0

        // Send messages
        const results = await Promise.all(guests.map(async (guest) => {
            if (!guest.phone) return false

            // Template Replacement
            let personalizedMessage = message
                .replace(/{name}/g, guest.name.split(' ')[0]) // First name only for friendlier tone
                .replace(/{fullname}/g, guest.name)
                .replace(/{code}/g, guest.code)
                .replace(/{inviter_name}/g, guest.invitedBy?.name || 'Gospodarza') // Fallback to 'Host'

            // Magic Link helper
            const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${guest.code}`
            personalizedMessage = personalizedMessage.replace(/{link}/g, `[%goto:${magicLink}%]`)

            const success = await sendSMS({ to: guest.phone, message: personalizedMessage })
            return success
        }))

        sentCount = results.filter(r => r).length
        failedCount = guests.length - sentCount

        return { success: true, sent: sentCount, failed: failedCount }

    } catch (e) {
        console.error('Bulk SMS Error:', e)
        return { success: false, sent: 0, failed: 0, error: 'Internal Server Error' }
    }
}

// === GUEST MANAGEMENT ACTIONS (Restored) ===

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export async function generateInvite(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const maxInvites = parseInt(formData.get('maxInvites') as string || '0')
    const plusOneAllowed = formData.get('plusOneAllowed') === 'on'
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    if (!name) return { error: 'Name required' }

    const newCode = generateCode()

    try {
        await prisma.guest.create({
            data: {
                name,
                code: newCode,
                role,
                maxInvites,
                plusOneAllowed,
                invitedById: session.id,
                phone: phone || null,
                email: email || null
            }
        })

        revalidatePath('/admin')
        return { success: true, code: newCode }
    } catch (e) {
        console.error('Generate User Error:', e)
        if (e instanceof Error) {
            return { error: `Failed: ${e.message}` }
        }
        return { error: 'Failed to create invite' }
    }
}

export async function updateGuestAdmin(formData: FormData) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    const id = formData.get('guestId') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const maxInvites = parseInt(formData.get('maxInvites') as string || '0')
    const plusOneAllowed = formData.get('plusOneAllowed') === 'on'
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    if (!id || !name) return { error: 'Name and ID required' }

    try {
        await prisma.guest.update({
            where: { id },
            data: {
                name,
                role,
                maxInvites,
                plusOneAllowed,
                phone: phone || null,
                email: email || null
            }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to update guest' }
    }
}

export async function deleteGuest(id: string) {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' }

    try {
        await prisma.guest.delete({ where: { id } })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed' }
    }
}

// === CSV IMPORT ===

export type CSVImportResult = {
    success: boolean
    created: number
    skipped: number
    errors: string[]
}

export async function importGuestsFromCSV(csvContent: string): Promise<CSVImportResult> {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
        return { success: false, created: 0, skipped: 0, errors: ['Unauthorized'] }
    }

    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
        return { success: false, created: 0, skipped: 0, errors: ['CSV must have header row and at least one data row'] }
    }

    // Parse header to find name and phone columns
    const header = lines[0].toLowerCase().split(',').map(h => h.trim())
    const nameIndex = header.findIndex(h => h === 'name' || h === 'imie' || h === 'imię')
    const phoneIndex = header.findIndex(h => h === 'phone' || h === 'telefon' || h === 'tel')

    if (nameIndex === -1) {
        return { success: false, created: 0, skipped: 0, errors: ['CSV must have a "name" column'] }
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(',').map(v => v.trim())
        const name = values[nameIndex]
        const phone = phoneIndex !== -1 ? values[phoneIndex] : null

        if (!name) {
            skipped++
            errors.push(`Row ${i + 1}: Missing name`)
            continue
        }

        try {
            const code = generateCode()
            await prisma.guest.create({
                data: {
                    name,
                    code,
                    phone: phone || null,
                    role: 'GUEST',
                    invitedById: session.id
                }
            })
            created++
        } catch (e) {
            skipped++
            errors.push(`Row ${i + 1}: ${name} - Failed to create`)
        }
    }

    revalidatePath('/admin')
    return { success: true, created, skipped, errors }
}
