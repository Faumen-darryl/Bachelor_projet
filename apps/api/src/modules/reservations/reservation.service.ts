import { prisma } from '../../lib/prisma';
import { stripe } from '../../lib/stripe';
import { generateInvoicePdf } from '../../utils/pdf';
import { ReservationStatus } from '@prisma/client';

// Crée une réservation pour un lieu.
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
  const venue = await prisma.venue.findUnique({
    where: { id: data.venueId },
  });

  if (!venue) throw new Error('VENUE_NOT_FOUND');
  if (!venue.isActive) throw new Error('VENUE_NOT_AVAILABLE');

  const start = new Date(data.startAt);
  const end = new Date(data.endAt);

  // Vérifie qu'aucune réservation active ne chevauche la période demandée.
  const conflict = await prisma.reservation.findFirst({
    where: {
      venueId: data.venueId,
      status: {
        in: ['EN_ATTENTE', 'CONFIRMEE'],
      },
      OR: [
        {
          startAt: { lte: end },
          endAt: { gte: start },
        },
      ],
    },
  });

  if (conflict) throw new Error('VENUE_ALREADY_BOOKED');

  // Calcule le montant du lieu selon la durée de la réservation.
  const hours = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  );

  let totalAmount = Number(venue.pricePerHour) * hours;

  // Ajoute au montant total les services optionnels sélectionnés.
  let servicesData: {
    serviceId: number;
    price: number;
    quantity: number;
  }[] = [];

  if (data.serviceIds && data.serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: {
        id: {
          in: data.serviceIds,
        },
      },
    });

    servicesData = services.map((s) => ({
      serviceId: s.id,
      price: Number(s.price),
      quantity: 1,
    }));

    totalAmount += servicesData.reduce(
      (acc, s) => acc + s.price * s.quantity,
      0
    );
  }

  // L'acompte correspond à 30 % du montant total.
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
      reservationServices: {
        create: servicesData,
      },
    },
    include: {
      venue: true,
      reservationServices: {
        include: {
          service: true,
        },
      },
    },
  });

  // Informe le propriétaire du lieu qu'une nouvelle réservation a été créée.
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

// Crée une réservation directe pour un service.
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
    where: {
      id: data.serviceId,
    },
    include: {
      provider: true,
    },
  });

  if (!service) throw new Error('SERVICE_NOT_FOUND');
  if (!service.isActive) throw new Error('SERVICE_NOT_AVAILABLE');

  const totalAmount = Number(service.price);

  // L'acompte correspond à 30 % du prix du service.
  const deposit = totalAmount * 0.3;

  // Recherche un lieu actif appartenant au prestataire.
  const providerVenue = await prisma.venue.findFirst({
    where: {
      ownerId: service.providerId,
      isActive: true,
    },
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
        create: [
          {
            serviceId: data.serviceId,
            price: Number(service.price),
            quantity: 1,
          },
        ],
      },
    },
    include: {
      venue: true,
      reservationServices: {
        include: {
          service: true,
        },
      },
    },
  });

  // Informe le prestataire qu'une nouvelle demande de service a été créée.
  await prisma.notification.create({
    data: {
      userId: service.providerId,
      type: 'CONFIRMATION',
      title: 'Nouvelle demande de service !',
      content: `${service.name} — Demande de ${new Date(
        start
      ).toLocaleDateString('fr-FR')}.`,
    },
  });

  return reservation;
};

// Crée une intention de paiement Stripe pour l'acompte de la réservation.
export const createPaymentIntent = async (
  reservationId: number,
  clientId: number
) => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id: reservationId,
    },
    include: {
      venue: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.clientId !== clientId) throw new Error('FORBIDDEN');
  if (reservation.status !== 'EN_ATTENTE') {
    throw new Error('ALREADY_PAID');
  }

  // Stripe attend le montant dans la plus petite unité monétaire.
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

// Confirme le paiement et enregistre le paiement associé à la réservation.
export const confirmPayment = async (reservationId: number) => {
  const reservation = await prisma.reservation.update({
    where: {
      id: reservationId,
    },
    data: {
      status: 'CONFIRMEE',
    },
    include: {
      client: true,
      venue: true,
      reservationServices: {
        include: {
          service: true,
        },
      },
      payments: true,
    },
  });

  // Enregistre le paiement comme réussi.
  await prisma.payment.create({
    data: {
      reservationId,
      amount: reservation.deposit,
      method: 'CARTE_BANCAIRE',
      status: 'REUSSI',
      paidAt: new Date(),
    },
  });

  // Informe le client que sa réservation est confirmée.
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

// Récupère toutes les réservations effectuées par un client.
export const getClientReservations = async (clientId: number) => {
  return await prisma.reservation.findMany({
    where: {
      clientId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      venue: {
        include: {
          photos: {
            where: {
              isMain: true,
            },
            take: 1,
          },
        },
      },
      reservationServices: {
        include: {
          service: true,
        },
      },
      payments: true,
    },
  });
};

// Récupère toutes les réservations reçues par un prestataire.
export const getProviderReservations = async (
  providerId: number
) => {
  return await prisma.reservation.findMany({
    where: {
      venue: {
        ownerId: providerId,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      venue: {
        include: {
          photos: {
            where: {
              isMain: true,
            },
            take: 1,
          },
        },
      },
      reservationServices: {
        include: {
          service: true,
        },
      },
      payments: true,
    },
  });
};

// Récupère le détail d'une réservation accessible par l'utilisateur.
export const getReservationById = async (
  id: number,
  userId: number
) => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id,
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      venue: {
        include: {
          photos: true,
          owner: true,
        },
      },
      reservationServices: {
        include: {
          service: true,
        },
      },
      payments: true,
      review: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

  // Autorise uniquement le client ou le propriétaire du lieu à consulter la réservation.
  if (
    reservation.clientId !== userId &&
    reservation.venue.ownerId !== userId
  ) {
    throw new Error('FORBIDDEN');
  }

  return reservation;
};

// Annule une réservation appartenant au client connecté.
export const cancelReservation = async (
  id: number,
  userId: number
) => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id,
    },
    include: {
      venue: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.clientId !== userId) throw new Error('FORBIDDEN');
  if (reservation.status === 'TERMINEE') {
    throw new Error('CANNOT_CANCEL');
  }

  await prisma.reservation.update({
    where: {
      id,
    },
    data: {
      status: 'ANNULEE',
    },
  });

  // Informe le propriétaire du lieu de l'annulation.
  await prisma.notification.create({
    data: {
      userId: reservation.venue.ownerId,
      type: 'ANNULATION',
      title: 'Réservation annulée',
      content: `La réservation #${id} a été annulée par le client.`,
    },
  });

  return {
    message: 'Réservation annulée avec succès',
  };
};

// Permet au prestataire de confirmer ou de refuser une réservation.
export const providerConfirmReservation = async (
  id: number,
  providerId: number,
  action: 'CONFIRMEE' | 'ANNULEE',
  reason?: string
) => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id,
    },
    include: {
      venue: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.venue.ownerId !== providerId) {
    throw new Error('FORBIDDEN');
  }
  if (reservation.status !== 'EN_ATTENTE') {
    throw new Error('ALREADY_PROCESSED');
  }

  await prisma.reservation.update({
    where: {
      id,
    },
    data: {
      status: action,
    },
  });

  // Informe le client de la décision du prestataire.
  await prisma.notification.create({
    data: {
      userId: reservation.clientId,
      type:
        action === 'CONFIRMEE'
          ? 'CONFIRMATION'
          : 'ANNULATION',
      title:
        action === 'CONFIRMEE'
          ? 'Réservation confirmée !'
          : 'Réservation refusée',
      content:
        action === 'CONFIRMEE'
          ? `Votre réservation pour ${reservation.venue.name} a été confirmée.`
          : `Votre réservation a été refusée. ${reason || ''}`,
    },
  });

  return {
    message:
      action === 'CONFIRMEE'
        ? 'Réservation confirmée'
        : 'Réservation refusée',
  };
};

// Génère la facture PDF d'une réservation confirmée ou terminée.
export const getInvoice = async (
  id: number,
  userId: number
): Promise<Buffer> => {
  const reservation = await prisma.reservation.findUnique({
    where: {
      id,
    },
    include: {
      client: true,
      venue: true,
      reservationServices: {
        include: {
          service: true,
        },
      },
      payments: true,
    },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (reservation.clientId !== userId) throw new Error('FORBIDDEN');

  // La facture n'est disponible que pour une réservation confirmée ou terminée.
  if (
    reservation.status !== 'CONFIRMEE' &&
    reservation.status !== 'TERMINEE'
  ) {
    throw new Error('INVOICE_NOT_AVAILABLE');
  }

  const paidAt = reservation.payments[0]?.paidAt || new Date();

  // Prépare les données utilisées pour générer le document PDF.
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