import { prisma } from '../../lib/prisma';

// Récupère tous les utilisateurs avec les informations utiles à l'administration.
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isVerified: true,
      phone: true,
      createdAt: true,
      companyName: true,
      siret: true,
      companyAddress: true,
      companyCity: true,
      companyZip: true,
      kycStatus: true,
      kycSubmittedAt: true,
    },
  });
};

// Met à jour le rôle d'un utilisateur.
export const updateUserRole = async (userId: number, role: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, email: true, role: true },
  });
};

// Supprime un utilisateur à partir de son identifiant.
export const deleteUser = async (userId: number) => {
  await prisma.user.delete({ where: { id: userId } });

  return { message: 'Utilisateur supprimé' };
};

// Valide ou rejette la vérification KYC d'un utilisateur.
export const validateKyc = async (
  userId: number,
  action: 'VALIDE' | 'REJETE',
  reason?: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error('USER_NOT_FOUND');

  // Met à jour le statut KYC et les informations associées à la décision.
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

  // Informe l'utilisateur du résultat de la vérification KYC.
  await prisma.notification.create({
    data: {
      userId,
      type: action === 'VALIDE' ? 'CONFIRMATION' : 'ANNULATION',
      title:
        action === 'VALIDE'
          ? 'Compte prestataire validé !'
          : 'Vérification KYC refusée',
      content:
        action === 'VALIDE'
          ? 'Félicitations ! Votre compte prestataire a été validé. Vous pouvez maintenant publier vos lieux et services.'
          : `Votre demande KYC a été refusée. ${
              reason || 'Veuillez contacter le support.'
            }`,
    },
  });

  return updated;
};

// Récupère toutes les réservations de lieux avec les données associées.
export const getAllReservations = async () => {
  return await prisma.reservation.findMany({
    orderBy: { createdAt: 'desc' },
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
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
      payments: true,
    },
  });
};

// Récupère toutes les réservations de services.
export const getAllServiceBookings = async () => {
  return await prisma.serviceBooking.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      servicePayments: true,
    },
  });
};

// Récupère tous les services actuellement actifs.
export const getAllServices = async () => {
  return await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      photos: {
        where: { isMain: true },
        take: 1,
      },
    },
  });
};

// Récupère tous les lieux enregistrés sur la plateforme.
export const getAllVenues = async () => {
  return await prisma.venue.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      photos: {
        where: { isMain: true },
        take: 1,
      },
    },
  });
};

// Calcule les principales statistiques utilisées dans l'espace d'administration.
export const getPlatformStats = async () => {
  // Exécute les différents calculs indépendants en parallèle.
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
      where: {
        role: 'PRESTATAIRE',
        kycStatus: 'EN_ATTENTE',
      },
    }),
  ]);

  // Regroupe les utilisateurs par rôle.
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });

  // Regroupe les réservations selon leur statut.
  const reservationsByStatus = await prisma.reservation.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  // Prépare les données finales retournées au tableau de bord.
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