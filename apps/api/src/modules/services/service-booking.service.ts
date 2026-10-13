import { prisma } from '../../lib/prisma';

// Crée une nouvelle réservation pour un service.
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
  if (service.providerId === clientId) {
    throw new Error('CANNOT_BOOK_OWN_SERVICE');
  }

  const totalAmount = Number(service.price);

  // L'acompte correspond à 30 % du prix total du service.
  const deposit = totalAmount * 0.3;

  const booking = await prisma.serviceBooking.create({
    data: {
      clientId,
      serviceId: data.serviceId,
      eventDate: new Date(data.eventDate),
      eventEndDate: new Date(data.eventEndDate),
      guestCount: data.guestCount,
      totalAmount,
      deposit,
      notes: data.notes,
    },
    include: {
      service: {
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
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
      content: `${booking.client.firstName} souhaite réserver "${service.name}".`,
    },
  });

  return booking;
};

// Récupère les réservations de services effectuées par un client.
export const getClientServiceBookings = async (
  clientId: number
) => {
  return await prisma.serviceBooking.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    include: {
      service: {
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          photos: {
            where: { isMain: true },
            take: 1,
          },
        },
      },
      servicePayments: true,
    },
  });
};

// Récupère les réservations de services reçues par un prestataire.
export const getProviderServiceBookings = async (
  providerId: number
) => {
  return await prisma.serviceBooking.findMany({
    where: {
      service: {
        providerId,
      },
    },
    orderBy: { createdAt: 'desc' },
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
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
        },
      },
      servicePayments: true,
    },
  });
};

// Permet au prestataire de confirmer ou de refuser une réservation de service.
export const confirmServiceBooking = async (
  bookingId: number,
  providerId: number,
  action: 'CONFIRMEE' | 'ANNULEE',
  reason?: string
) => {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: {
      service: true,
      client: true,
    },
  });

  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  if (booking.service.providerId !== providerId) {
    throw new Error('FORBIDDEN');
  }
  if (booking.status !== 'EN_ATTENTE') {
    throw new Error('ALREADY_PROCESSED');
  }

  await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: { status: action },
  });

  // Informe le client de la décision prise par le prestataire.
  await prisma.notification.create({
    data: {
      userId: booking.clientId,
      type:
        action === 'CONFIRMEE'
          ? 'CONFIRMATION'
          : 'ANNULATION',
      title:
        action === 'CONFIRMEE'
          ? 'Service confirmé !'
          : 'Demande refusée',
      content:
        action === 'CONFIRMEE'
          ? `Votre demande pour "${booking.service.name}" a été confirmée.`
          : `Votre demande pour "${booking.service.name}" a été refusée. ${reason || ''}`,
    },
  });

  return {
    message:
      action === 'CONFIRMEE'
        ? 'Service confirmé'
        : 'Service refusé',
  };
};

// Annule une réservation de service appartenant au client.
export const cancelServiceBooking = async (
  bookingId: number,
  clientId: number
) => {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  if (booking.clientId !== clientId) throw new Error('FORBIDDEN');
  if (booking.status === 'TERMINEE') {
    throw new Error('CANNOT_CANCEL');
  }

  await prisma.serviceBooking.update({
    where: { id: bookingId },
    data: { status: 'ANNULEE' },
  });

  // Informe le prestataire que la réservation a été annulée.
  await prisma.notification.create({
    data: {
      userId: booking.service.providerId,
      type: 'ANNULATION',
      title: 'Réservation annulée',
      content: `La réservation pour "${booking.service.name}" a été annulée.`,
    },
  });

  return {
    message: 'Réservation annulée',
  };
};

// Récupère les messages liés à une réservation de service.
export const getServiceBookingMessages = async (
  bookingId: number,
  userId: number
) => {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) throw new Error('BOOKING_NOT_FOUND');

  // Vérifie que l'utilisateur est bien le client ou le prestataire concerné.
  if (
    booking.clientId !== userId &&
    booking.service.providerId !== userId
  ) {
    throw new Error('FORBIDDEN');
  }

  // Marque comme lus les messages reçus lorsque la conversation est ouverte.
  await prisma.serviceMessage.updateMany({
    where: {
      serviceBookingId: bookingId,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  // Retourne les messages dans l'ordre chronologique.
  return await prisma.serviceMessage.findMany({
    where: {
      serviceBookingId: bookingId,
    },
    orderBy: {
      sentAt: 'asc',
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

// Envoie un message dans une conversation liée à une réservation de service.
export const sendServiceMessage = async (
  senderId: number,
  bookingId: number,
  content: string
) => {
  const booking = await prisma.serviceBooking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) throw new Error('BOOKING_NOT_FOUND');

  // Détermine le destinataire selon l'utilisateur qui envoie le message.
  const receiverId =
    booking.clientId === senderId
      ? booking.service.providerId
      : booking.clientId;

  // Crée le message comme non lu pour le destinataire.
  const message = await prisma.serviceMessage.create({
    data: {
      senderId,
      receiverId,
      serviceBookingId: bookingId,
      content,
      isRead: false,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Informe le destinataire qu'un nouveau message a été reçu.
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'MESSAGE',
      title: 'Nouveau message',
      content: `${message.sender.firstName} vous a envoyé un message.`,
    },
  });

  return message;
};

// Récupère les conversations liées aux réservations de services de l'utilisateur.
export const getServiceConversations = async (
  userId: number
) => {
  const bookings = await prisma.serviceBooking.findMany({
    where: {
      OR: [
        { clientId: userId },
        { service: { providerId: userId } },
      ],
      serviceMessages: {
        some: {},
      },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      service: {
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      serviceMessages: {
        orderBy: {
          sentAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Calcule le nombre de messages non lus pour chaque réservation.
  const unreadCounts = await prisma.serviceMessage.groupBy({
    by: ['serviceBookingId'],
    where: {
      receiverId: userId,
      isRead: false,
    },
    _count: {
      id: true,
    },
  });

  // Associe chaque réservation à son nombre de messages non lus.
  const unreadMap: Record<number, number> = {};

  unreadCounts.forEach((u) => {
    unreadMap[u.serviceBookingId] = u._count.id;
  });

  // Prépare les informations nécessaires à l'affichage de chaque conversation.
  return bookings.map((b) => {
    const lastMessage = b.serviceMessages[0];
    const isClient = b.clientId === userId;
    const otherUser = isClient
      ? b.service.provider
      : b.client;

    return {
      bookingId: b.id,
      type: 'SERVICE' as const,
      otherUser,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            sentAt: lastMessage.sentAt,
            senderId: lastMessage.senderId,

            // Un message envoyé par l'utilisateur est considéré comme lu de son côté.
            isRead:
              lastMessage.senderId === userId
                ? true
                : lastMessage.isRead,

            isMine: lastMessage.senderId === userId,
          }
        : null,

      // Nombre de messages non lus reçus dans cette conversation.
      unreadCount: unreadMap[b.id] || 0,

      serviceName: b.service.name,
      serviceCategory: b.service.category,
      isClient,
    };
  });
};