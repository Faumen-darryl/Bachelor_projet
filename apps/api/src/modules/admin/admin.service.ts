import { prisma } from '../../lib/prisma';

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, firstName: true,
      lastName: true, role: true, isVerified: true,
      phone: true, createdAt: true,
      companyName: true, siret: true,
      companyAddress: true, companyCity: true,
      companyZip: true, kycStatus: true,
      kycSubmittedAt: true,
    },
  });
};

export const updateUserRole = async (userId: number, role: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, email: true, role: true },
  });
};

export const deleteUser = async (userId: number) => {
  await prisma.user.delete({ where: { id: userId } });
  return { message: 'Utilisateur supprimé' };
};

export const validateKyc = async (
  userId: number,
  action: 'VALIDE' | 'REJETE',
  reason?: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      kycStatus: action,
      ...(action === 'VALIDE' && { kycValidatedAt: new Date() }),
      ...(action === 'REJETE' && {
        kycRejectedAt: new Date(),
        kycRejectReason: reason,
      }),
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      type: action === 'VALIDE' ? 'CONFIRMATION' : 'ANNULATION',
      title: action === 'VALIDE'
        ? 'Compte prestataire validé !'
        : 'Vérification KYC refusée',
      content: action === 'VALIDE'
        ? 'Félicitations ! Votre compte prestataire a été validé. Vous pouvez maintenant publier vos lieux et services.'
        : `Votre demande KYC a été refusée. ${reason || 'Veuillez contacter le support.'}`,
    },
  });

  return updated;
};

export const getAllReservations = async () => {
  return await prisma.reservation.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true } },
      venue: { select: { id: true, name: true, city: true } },
      payments: true,
    },
  });
};

export const getAllServiceBookings = async () => {
  return await prisma.serviceBooking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true } },
      service: {
        select: {
          id: true, name: true, category: true,
          provider: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      servicePayments: true,
    },
  });
};

export const getAllServices = async () => {
  return await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      provider: { select: { id: true, firstName: true, lastName: true, email: true } },
      photos: { where: { isMain: true }, take: 1 },
    },
  });
};

export const getAllVenues = async () => {
  return await prisma.venue.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      photos: { where: { isMain: true }, take: 1 },
    },
  });
};

export const getPlatformStats = async () => {
  const [
    totalUsers,
    totalVenues,
    totalServices,
    totalReservations,
    totalServiceBookings,
    confirmedPayments,
    pendingKyc,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.venue.count({ where: { isActive: true } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.reservation.count(),
    prisma.serviceBooking.count(),
    prisma.payment.aggregate({
      where: { status: 'REUSSI' },
      _sum: { amount: true },
    }),
    prisma.user.count({
      where: { role: 'PRESTATAIRE', kycStatus: 'EN_ATTENTE' },
    }),
  ]);

  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });

  const reservationsByStatus = await prisma.reservation.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return {
    totalUsers,
    totalVenues,
    totalServices,
    totalReservations: totalReservations + totalServiceBookings,
    totalRevenue: confirmedPayments._sum.amount || 0,
    pendingKyc,
    usersByRole: usersByRole.reduce((acc, r) => {
      acc[r.role] = r._count.id;
      return acc;
    }, {} as Record<string, number>),
    reservationsByStatus: reservationsByStatus.reduce((acc, r) => {
      acc[r.status] = r._count.id;
      return acc;
    }, {} as Record<string, number>),
  };
};