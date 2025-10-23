import { PrismaClient } from '@prisma/client';
import { USERS, PRODUCTS } from './mock.js';

const prisma = new PrismaClient();

async function main() {
  // delete pre-existing data
  //await prisma.user.deleteMany();
  await prisma.product.deleteMany();

  // insert mock data
  //await prisma.user.createMany({ data: USERS, skipDuplicates: true });
  await prisma.product.createMany({ data: PRODUCTS, skipDuplicates: true });
}

main()
  .then(async () => {
    await prisma.$disconnect(); // disconnect prisma connection to DB
  })
  .catch(async (error) => {
    console.log(error);
    await prisma.$disconnect();
    process.exit(1); // terminate the current node process (0: normal, 1: error)
  });
