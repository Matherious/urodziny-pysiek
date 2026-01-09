'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getSession } from './auth'
import { sendEmail } from '@/lib/notifications'

export async function updateRSVP(formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    const rsvpMain = formData.get('rsvpMain') === 'on'
    const rsvpDinner = formData.get('rsvpDinner') === 'on'
    const rsvpAfterParty = formData.get('rsvpAfterParty') === 'on'
    const diet = formData.get('diet') as string
    const songRequest = formData.get('songRequest') as string

    try {
        await prisma.guest.update({
            where: { id: session.id },
            data: {
                rsvpMain,
                rsvpDinner,
                rsvpAfterParty,
                diet,
                songRequest,
                plusOneName: formData.get('plusOneName') as string,
                plusOneDiet: formData.get('plusOneDiet') as string,
            }
        })

        if (process.env.SMTP_USER && session.email) {
            await sendEmail({
                to: session.email,
                subject: 'Potwierdzenie RSVP - Urodziny Gemini',
                html: `
                    <h1>Cześć ${session.name}!</h1>
                    <p>Dzięki za aktualizację RSVP.</p>
                    <p>Status: ${rsvpMain ? '✅ Będę' : '❌ Nie będzie mnie'}</p>
                `
            })
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to update RSVP' }
    }
}

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}


export async function inviteFriend(formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    if (session.maxInvites <= 0) return { error: 'No invites left' }

    // Check current invite count
    const guest = await prisma.guest.findUnique({
        where: { id: session.id },
        include: { invitees: true }
    })

    if (!guest || guest.invitees.length >= guest.maxInvites) {
        return { error: 'Invite quota exceeded' }
    }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    if (!name) return { error: 'Name is required' }

    const newCode = generateCode()

    try {
        await prisma.guest.create({
            data: {
                name,
                code: newCode,
                role: 'GUEST',
                invitedById: session.id,
                phone: phone || null,
                email: email || null
            }
        })

        // Generate Magic Link
        // Assuming host is localhost for dev, but in prod it should be env var
        // Since we are running locally user can see it works.
        // In real prod we need NEXT_PUBLIC_APP_URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const magicLink = `${appUrl}/invite/${newCode}`

        // Build notification tasks
        const tasks = []

        if (phone) {
            // Using SMSAPI's cut.li feature via [%goto:URL%] syntax
            // This automatically shortens the link and tracks clicks
            const message = `Cześć ${name}! ${session.name} zaprasza Cię na urodziny. Twój kod: ${newCode}. Link: [%goto:${magicLink}%]`
            // We use a simplified sendSMS here similar to bulk
            tasks.push(
                // Dynamic import or reusing the one from notifications
                // Since sendSMS is in 'lib/notifications', we need to import it if not already imported.
                // It is imported at line 6.
                import('@/lib/notifications').then(mod => mod.sendSMS({ to: phone, message }))
            )
        }

        if (email) {
            tasks.push(
                import('@/lib/notifications').then(mod => mod.sendEmail({
                    to: email,
                    subject: 'Zaproszenie na Urodziny!',
                    html: `
                        <h1>Cześć ${name}!</h1>
                        <p>${session.name} zaprasza Cię na wspólne świętowanie!</p>
                        <p>Twój kod wstępu to: <strong>${newCode}</strong></p>
                        <p><a href="${magicLink}" style="padding: 10px 20px; background: #DAA520; color: #000; text-decoration: none; border-radius: 5px;">Potwierdź obecność (RSVP)</a></p>
                        <p>Lub wejdź przez link: ${magicLink}</p>
                    `
                }))
            )
        }

        // Fire and forget notifications to keep UI snappy, or await them?
        // Await to report errors if needed.
        await Promise.allSettled(tasks)

        revalidatePath('/dashboard')
        return { success: true, code: newCode }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to create invite' }
    }
}

export async function deleteInvite(guestId: string) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    try {
        const guestToDelete = await prisma.guest.findUnique({
            where: { id: guestId }
        })

        if (!guestToDelete) return { error: 'Guest not found' }

        // SECURITY: Strict ownership check
        if (guestToDelete.invitedById !== session.id) {
            return { error: 'You can only delete guests you invited' }
        }

        await prisma.guest.delete({
            where: { id: guestId }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to delete invite' }
    }
}

export async function updateInvite(formData: FormData) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    const guestId = formData.get('guestId') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    if (!guestId || !name) return { error: 'Missing required fields' }

    try {
        const guestToUpdate = await prisma.guest.findUnique({
            where: { id: guestId }
        })

        if (!guestToUpdate) return { error: 'Guest not found' }

        // SECURITY: Strict ownership check
        if (guestToUpdate.invitedById !== session.id) {
            return { error: 'You can only edit guests you invited' }
        }

        await prisma.guest.update({
            where: { id: guestId },
            data: {
                name,
                phone: phone || null,
                email: email || null
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to update invite' }
    }
}
