
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const guests = await prisma.guest.findMany({
    select: {
      name: true,
      code: true,
      role: true
    }
  })
  console.log('--- CODES LIST ---')
  console.table(guests)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
