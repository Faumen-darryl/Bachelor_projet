import { prisma } from '../../lib/prisma';

// Récupère les messages d'une réservation accessible par l'utilisateur.
export const getReservationMessages = async (
  reservationId: number,
  userId: number
) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { venue: true },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

  // Vérifie que l'utilisateur est bien le client ou le propriétaire du lieu.
  if (
    reservation.clientId !== userId &&
    reservation.venue.ownerId !== userId
  ) {
    throw new Error('FORBIDDEN');
  }

  // Marque comme lus les messages reçus lorsque la conversation est ouverte.
  await prisma.message.updateMany({
    where: {
      reservationId,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  // Retourne les messages dans l'ordre chronologique.
  return await prisma.message.findMany({
    where: { reservationId },
    orderBy: { sentAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  });
};

// Récupère toutes les conversations de l'utilisateur.
export const getConversations = async (userId: number) => {
  const reservations = await prisma.reservation.findMany({
    where: {
      OR: [
        { clientId: userId },
        { venue: { ownerId: userId } },
      ],
      messages: { some: {} },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      venue: {
        select: {
          id: true,
          name: true,
          city: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Calcule le nombre de messages non lus pour chaque conversation.
  const unreadCounts = await prisma.message.groupBy({
    by: ['reservationId'],
    where: {
      receiverId: userId,
      isRead: false,
    },
    _count: { id: true },
  });

  // Associe chaque réservation à son nombre de messages non lus.
  const unreadMap: Record<number, number> = {};

  unreadCounts.forEach((u) => {
    unreadMap[u.reservationId] = u._count.id;
  });

  // Prépare les informations nécessaires à l'affichage de chaque conversation.
  return reservations.map((r) => {
    const lastMessage = r.messages[0];
    const isClient = r.clientId === userId;
    const otherUser = isClient ? r.venue.owner : r.client;

    return {
      reservationId: r.id,
      type: 'VENUE' as const,
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
      unreadCount: unreadMap[r.id] || 0,

      venue: {
        id: r.venue.id,
        name: r.venue.name,
        city: r.venue.city,
      },

      isClient,
    };
  });
};

// Retourne le nombre total de messages non lus par l'utilisateur.
export const getUnreadCount = async (userId: number) => {
  return await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  });
};

// Envoie le premier message lié à une réservation.
export const sendFirstMessage = async (
  senderId: number,
  reservationId: number,
  content: string
) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { venue: true },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');

  // Détermine automatiquement le destinataire selon l'expéditeur.
  const receiverId =
    reservation.clientId === senderId
      ? reservation.venue.ownerId
      : reservation.clientId;

  // Crée le message comme non lu pour le destinataire.
  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      reservationId,
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