import { prisma } from '../../lib/prisma';

export const getUserNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const getUnreadNotifications = async (userId: number) => {
  return await prisma.notification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: 'desc' },
  });
};

export const markAllAsRead = async (userId: number) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { message: 'Notifications marquées comme lues' };
};

export const markOneAsRead = async (id: number, userId: number) => {
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif) throw new Error('NOTIFICATION_NOT_FOUND');
  if (notif.userId !== userId) throw new Error('FORBIDDEN');

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};