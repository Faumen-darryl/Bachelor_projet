import { prisma } from '../../lib/prisma';

// Récupère les 50 notifications les plus récentes de l'utilisateur.
export const getUserNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

// Récupère toutes les notifications non lues de l'utilisateur.
export const getUnreadNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Marque toutes les notifications non lues de l'utilisateur comme lues.
export const markAllAsRead = async (userId: number) => {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return {
    message: 'Notifications marquées comme lues',
  };
};

// Marque une notification précise comme lue.
export const markOneAsRead = async (
  id: number,
  userId: number
) => {
  const notif = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notif) throw new Error('NOTIFICATION_NOT_FOUND');

  // Vérifie que la notification appartient bien à l'utilisateur connecté.
  if (notif.userId !== userId) throw new Error('FORBIDDEN');

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};