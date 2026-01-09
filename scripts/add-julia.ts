
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const guest = await prisma.guest.create({
        data: {
            name: 'Julia',
            code: code,
            role: 'FRIEND', // Using FRIEND as a safe default
            maxInvites: 1,  // Defaulting to +1 allowed, effectively 1 extra
            plusOneAllowed: true,
            invitedById: null,
            phone: '+48666101884'
        }
    })

    console.log(`Created guest: ${guest.name}`)
    console.log(`Code: ${guest.code}`)
    console.log(`Role: ${guest.role}`)
    console.log(`Link: http://localhost:3000/invite/${guest.code}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => await prisma.$disconnect())
