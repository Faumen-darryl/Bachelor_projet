import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";

// Forcer Prisma à utiliser la base de test
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

export const prismaTest = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_TEST },
  },
});

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
  await prismaTest.$disconnect();
});

async function cleanDatabase() {
  await prismaTest.message.deleteMany();
  await prismaTest.serviceMessage.deleteMany();
  await prismaTest.review.deleteMany();
  await prismaTest.payment.deleteMany();
  await prismaTest.servicePayment.deleteMany();
  await prismaTest.reservationService.deleteMany();
  await prismaTest.reservation.deleteMany();
  await prismaTest.serviceBooking.deleteMany();
  await prismaTest.availability.deleteMany();
  await prismaTest.notification.deleteMany();
  await prismaTest.venuePhoto.deleteMany();
  await prismaTest.servicePhoto.deleteMany();
  await prismaTest.venue.deleteMany();
  await prismaTest.service.deleteMany();
  await prismaTest.user.deleteMany();
}