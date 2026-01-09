
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const guest = await prisma.guest.create({
        data: {
            name: 'Klaudia Barmańska',
            code: code,
            role: 'VIP',
            maxInvites: 2,     // Can generate 2 invites
            plusOneAllowed: false, // Strict "2 additional friends" interpretation = 2 invites.
            invitedById: null // Top-level guest
        }
    })

    console.log(`Created guest: ${guest.name}`)
    console.log(`Code: ${guest.code}`)
    console.log(`Role: ${guest.role}`)
    console.log(`Max Invites: ${guest.maxInvites}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => await prisma.$disconnect())
