
import { prisma } from '../src/lib/db'

async function main() {
    console.log('--- START DEBUG ---')
    try {
        // 1. Check if ADMIN exists (since invitedById is used)
        const admin = await prisma.guest.findFirst({ where: { role: 'ADMIN' } })
        console.log('Admin found:', admin?.id)

        if (!admin) {
            console.error('No ADMIN user found! invitedById constraint might fail.')
        }

        // 2. Generate unique code
        const code = 'DBG' + Math.floor(Math.random() * 1000)

        console.log('Attempting to create guest with code:', code)

        const guest = await prisma.guest.create({
            data: {
                name: 'Debug User',
                code: code,
                role: 'FRIEND',
                maxInvites: 0,
                plusOneAllowed: true,
                invitedById: admin?.id, // Use actual admin ID
                phone: '+48123456789',
                email: 'debug@test.com'
            }
        })
        console.log('SUCCESS: Guest created:', guest)
    } catch (e) {
        console.error('FAILURE: Error creating guest:', e)
    }
}

main()
