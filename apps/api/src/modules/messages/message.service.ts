import { prisma } from '../../lib/prisma';

export const getReservationMessages = async (
  reservationId: number,
  userId: number
) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { venue: true },
  });

  if (!reservation) throw new Error('RESERVATION_NOT_FOUND');
  if (
    reservation.clientId !== userId &&
    reservation.venue.ownerId !== userId
  ) throw new Error('FORBIDDEN');

  // Marquer comme lus SEULEMENT quand on ouvre la conversation
  await prisma.message.updateMany({
    where: { reservationId, receiverId: userId, isRead: false },
    data: { isRead: true },
  });

  return await prisma.message.findMany({
    where: { reservationId },
    orderBy: { sentAt: 'asc' },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });
};

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
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
      venue: {
        select: {
          id: true, name: true, city: true,
          owner: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
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

  // Calculer les non-lus pour chaque conversation
  const unreadCounts = await prisma.message.groupBy({
    by: ['reservationId'],
    where: { receiverId: userId, isRead: false },
    _count: { id: true },
  });

  const unreadMap: Record<number, number> = {};
  unreadCounts.forEach(u => {
    unreadMap[u.reservationId] = u._count.id;
  });

  return reservations.map(r => {
    const lastMessage = r.messages[0];
    const isClient = r.clientId === userId;
    const otherUser = isClient ? r.venue.owner : r.client;

    return {
      reservationId: r.id,
      type: 'VENUE' as const,
      otherUser,
      lastMessage: lastMessage ? {
        content: lastMessage.content,
        sentAt: lastMessage.sentAt,
        senderId: lastMessage.senderId,
        // isRead est vrai seulement si c'est mon message OU si je l'ai déjà lu
        isRead: lastMessage.senderId === userId ? true : lastMessage.isRead,
        isMine: lastMessage.senderId === userId,
      } : null,
      // Nombre réel de messages non lus pour cet utilisateur
      unreadCount: unreadMap[r.id] || 0,
      venue: { id: r.venue.id, name: r.venue.name, city: r.venue.city },
      isClient,
    };
  });
};

export const getUnreadCount = async (userId: number) => {
  return await prisma.message.count({
    where: { receiverId: userId, isRead: false },
  });
};

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

  const receiverId = reservation.clientId === senderId
    ? reservation.venue.ownerId
    : reservation.clientId;

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      reservationId,
      content,
      isRead: false, // ← Toujours false à la création
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  });

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