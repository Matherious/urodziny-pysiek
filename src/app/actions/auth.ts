'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; lastAttempt: number }>()

export async function authenticate(formData: FormData) {
    const code = formData.get('code') as string

    // Rate Limiting Logic
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 // 15 minutes
    const maxAttempts = 5

    const record = rateLimit.get(ip) || { count: 0, lastAttempt: now }

    if (now - record.lastAttempt > windowMs) {
        // Reset window
        record.count = 0
        record.lastAttempt = now
    }

    if (record.count >= maxAttempts) {
        return { error: 'Too many attempts. Please try again later.' }
    }

    record.count++
    record.lastAttempt = now
    rateLimit.set(ip, record)

    if (!code) {
        return { error: 'Please enter a code' }
    }

    // Normalize code
    const normalizedCode = code.trim().toUpperCase()

    try {
        const guest = await prisma.guest.findUnique({
            where: { code: normalizedCode }
        })

        if (!guest) {
            return { error: 'Invalid access code' }
        }

        // Reset rate limit on success
        rateLimit.delete(ip)

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('session_code', guest.code, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/'
        })

        return { success: true }
    } catch (error) {
        console.error('Login error:', error)
        return { error: 'Something went wrong' }
    }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session_code')
    redirect('/')
}

export async function getSession() {
    const cookieStore = await cookies()
    const code = cookieStore.get('session_code')?.value

    if (!code) return null

    const guest = await prisma.guest.findUnique({
        where: { code }
    })

    return guest
}
