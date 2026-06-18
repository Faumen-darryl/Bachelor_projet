import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';
import { generateInvoicePdf } from '../../utils/pdf';
import { ReservationStatus } from '@prisma/client';

export const createReservation = async (
  clientId: number,
  data: {
    venueId: number;
    startAt: string;
    endAt: string;
    guestCount: number;
    serviceIds?: number[];
    notes?: string;
  }
) => {
  const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
  if (!venue) throw new Error('VENUE_NOT_FOUND');
  if (!venue.isActive) throw new Error('VENUE_NOT_AVAILABLE');

  const start = new Date(data.startAt);
  const end = new Date(data.endAt);

  const conflict = await prisma.reservation.findFirst({
    where: {
      venueId: data.venueId,
      status: { in: ['EN_ATTENTE', 'CONFIRMEE'] },
      OR: [{ startAt: { lte: end }, endAt: { gte: start } }],
    },
  });
  if (conflict) throw new Error('VENUE_ALREADY_BOOKED');

  const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  let totalAmount = Number(venue.pricePerHour) * hours;

  let servicesData: { serviceId: number; price: number; quantity: number }[] = [];
  if (data.serviceIds && data.serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: { id: { in: data.serviceIds } },
    });
    servicesData = services.map((s) => ({
      serviceId: s.id,
      price: Number(s.price),
      quantity: 1,
    }));
    totalAmount += servicesData.reduce((acc, s) => acc + s.price * s.quantity, 0);
  }

  const deposit = totalAmount * 0.3;

  const reservation = await prisma.reservation.create({
    data: {
      clientId,
      venueId: data.venueId,
      startAt: start,
      endAt: end,
      guestCount: data.guestCount,
      totalAmount,
      deposit,
      notes: data.notes,
      reservationServices: { create: servicesData },
    },
    include: {
      venue: true,
      reservationServices: { include: { service: true } },
    },
  });

  await prisma.notification.create({
    data: {
      userId: venue.ownerId,
      type: 'CONFIRMATION',
      title: 'Nouvelle réservation !',
      content: `Vous avez une nouvelle demande de réservation pour ${venue.name}.`,
    },
  });

  return reservation;
};

// Réservation directe d'un service sans lieu
export const bookService = async (
  clientId: number,
  data: {
    serviceId: number;
    eventDate: string;
    eventEndDate: string;
    guestCount: number;
    notes?: string;
  }
) => {
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
    include: { provider: true },
  });
  if (!service) throw new Error('SERVICE_NOT_FOUND');
  if (!service.isActive) throw new Error('SERVICE_NOT_AVAILABLE');

  // On utilise le premier lieu actif comme placeholder
  // ou on crée une réservation sans lieu
  const totalAmount = Number(service.price);
  const deposit = totalAmount * 0.3;

  // Chercher un lieu appartenant au prestataire du service
  const providerVenue = await prisma.venue.findFirst({
    where: { ownerId: service.providerId, isActive: true },
  });

  if (!providerVenue) {
    throw new Error('PROVIDER_HAS_NO_VENUE');
  }

  const start = new Date(data.eventDate);
  const end = new Date(data.eventEndDate);

  const reservation = await prisma.reservation.create({
    data: {
      clientId,
      venueId: providerVenue.id,
      startAt: start,
      endAt: end,
      guestCount: data.guestCount,
      totalAmount,
      deposit,
      notes: data.notes,
      reservationServices: {
        create: [{
          serviceId: data.serviceId,
          price: Number(service.price),
          quantity: 1,
        }],
      },
    },
    include: {
      venue: true,
      reservationServices: { include: { service: true } },
    },
  });

  // Notifier le prestataire
  await prisma.notification.create({
    data: {
      userId: service.providerId,
      type: 'CONFIRMATION',
      title: 'Nouvelle demande de service !',
      content: `${service.name} — Demande de ${new Date(start).toLocaleDateString('fr-FR')}.`,
    },
  });

  return reservation;
};

export const createPaymentIntent = async (
  reservationId: number,
  clientId: number
) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { venue: true },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.clientId !== clientId) throw new Error('FORBIDDEN');
  if (reservation.status !== 'EN_ATTENTE') throw new Error('ALREADY_PAID');

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(Number(reservation.deposit) * 100),
    currency: 'eur',
    metadata: {
      reservationId: reservation.id.toString(),
      clientId: clientId.toString(),
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    amount: reservation.deposit,
    reservationId,
  };
};

export const confirmPayment = async (reservationId: number) => {
  const reservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: 'CONFIRMEE' },
    include: {
      client: true,
      venue: true,
      reservationServices: { include: { service: true } },
      payments: true,
    },
  });

  await prisma.payment.create({
    data: {
      reservationId,
      amount: reservation.deposit,
      method: 'CARTE_BANCAIRE',
      status: 'REUSSI',
      paidAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: reservation.clientId,
      type: 'CONFIRMATION',
      title: 'Réservation confirmée !',
      content: `Votre réservation pour ${reservation.venue.name} est confirmée.`,
    },
  });

  return reservation;
};

export const getClientReservations = async (clientId: number) => {
  return await prisma.reservation.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    include: {
      venue: { include: { photos: { where: { isMain: true }, take: 1 } } },
      reservationServices: { include: { service: true } },
      payments: true,
    },
  });
};

export const getProviderReservations = async (providerId: number) => {
  return await prisma.reservation.findMany({
    where: { venue: { ownerId: providerId } },
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          id: true, firstName: true,
          lastName: true, email: true, phone: true,
        },
      },
      venue: { include: { photos: { where: { isMain: true }, take: 1 } } },
      reservationServices: { include: { service: true } },
      payments: true,
    },
  });
};

export const getReservationById = async (id: number, userId: number) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true } },
      venue: { include: { photos: true, owner: true } },
      reservationServices: { include: { service: true } },
      payments: true,
      review: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (
    reservation.clientId !== userId &&
    reservation.venue.ownerId !== userId
  ) throw new Error('FORBIDDEN');

  return reservation;
};

export const cancelReservation = async (id: number, userId: number) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { venue: true },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.clientId !== userId) throw new Error('FORBIDDEN');
  if (reservation.status === 'TERMINEE') throw new Error('CANNOT_CANCEL');

  await prisma.reservation.update({ where: { id }, data: { status: 'ANNULEE' } });

  await prisma.notification.create({
    data: {
      userId: reservation.venue.ownerId,
      type: 'ANNULATION',
      title: 'Réservation annulée',
      content: `La réservation #${id} a été annulée par le client.`,
    },
  });

  return { message: 'Réservation annulée avec succès' };
};

export const providerConfirmReservation = async (
  id: number,
  providerId: number,
  action: 'CONFIRMEE' | 'ANNULEE',
  reason?: string
) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { venue: true },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.venue.ownerId !== providerId) throw new Error('FORBIDDEN');
  if (reservation.status !== 'EN_ATTENTE') throw new Error('ALREADY_PROCESSED');

  await prisma.reservation.update({ where: { id }, data: { status: action } });

  await prisma.notification.create({
    data: {
      userId: reservation.clientId,
      type: action === 'CONFIRMEE' ? 'CONFIRMATION' : 'ANNULATION',
      title: action === 'CONFIRMEE' ? 'Réservation confirmée !' : 'Réservation refusée',
      content: action === 'CONFIRMEE'
        ? `Votre réservation pour ${reservation.venue.name} a été confirmée.`
        : `Votre réservation a été refusée. ${reason || ''}`,
    },
  });

  return { message: action === 'CONFIRMEE' ? 'Réservation confirmée' : 'Réservation refusée' };
};

export const getInvoice = async (id: number, userId: number): Promise<Buffer> => {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      client: true,
      venue: true,
      reservationServices: { include: { service: true } },
      payments: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.clientId !== userId) throw new Error('FORBIDDEN');
  if (
    reservation.status !== 'CONFIRMEE' &&
    reservation.status !== 'TERMINEE'
  ) throw new Error('INVOICE_NOT_AVAILABLE');

  const paidAt = reservation.payments[0]?.paidAt || new Date();

  return generateInvoicePdf({
    reservationId: reservation.id,
    clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
    clientEmail: reservation.client.email,
    venueName: reservation.venue.name,
    startAt: reservation.startAt,
    endAt: reservation.endAt,
    services: reservation.reservationServices.map((rs) => ({
      name: rs.service.name,
      price: Number(rs.price),
      quantity: rs.quantity,
    })),
    totalAmount: Number(reservation.totalAmount),
    deposit: Number(reservation.deposit),
    paidAt,
  });
};