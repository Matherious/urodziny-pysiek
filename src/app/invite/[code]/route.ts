
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params

    // Artificial delay to prevent brute-forcing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500))

    if (!code) {
        redirect('/?error=invalid_code')
    }

    const normalizedCode = code.trim().toUpperCase()

    try {
        const guest = await prisma.guest.findUnique({
            where: { code: normalizedCode }
        })

        if (!guest) {
            redirect('/?error=invalid_code')
        }

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('session_code', guest.code, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/'
        })

    } catch (error) {
        console.error('Invite Link Error:', error)
        redirect('/?error=unknown')
    }

    redirect('/dashboard')
}
