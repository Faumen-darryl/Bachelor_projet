import { prisma } from '../../lib/prisma';

import cloudinary from '../../lib/cloudinary';

// Définit les filtres disponibles pour la recherche de services.
interface ServiceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Crée un nouveau service pour un prestataire.
export const createService = async (
  providerId: number,
  data: {
    name: string;
    category: string;
    description: string;
    price: number;
  }
) => {
  return await prisma.service.create({
    data: {
      ...data,
      providerId,
    },
    include: {
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

// Récupère les services actifs selon les filtres et la pagination demandés.
export const getServices = async (filters: ServiceFilters) => {
  const {
    category,
    minPrice,
    maxPrice,
    page = 1,
    limit = 12,
  } = filters;

  const where: any = {
    isActive: true,
  };

  // Ajoute le filtre de catégorie lorsqu'il est renseigné.
  if (category) {
    where.category = {
      contains: category,
    };
  }

  // Ajoute les limites de prix lorsqu'elles sont renseignées.
  if (minPrice || maxPrice) {
    where.price = {};

    if (minPrice) {
      where.price.gte = Number(minPrice);
    }

    if (maxPrice) {
      where.price.lte = Number(maxPrice);
    }
  }

  // Calcule le nombre d'éléments à ignorer selon la page demandée.
  const skip = (Number(page) - 1) * Number(limit);

  // Récupère les services et leur nombre total en parallèle.
  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        photos: {
          where: {
            isMain: true,
          },
          take: 1,
        },
      },
    }),

    prisma.service.count({
      where,
    }),
  ]);

  return {
    data: services,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// Récupère le détail d'un service à partir de son identifiant.
export const getServiceById = async (id: number) => {
  const service = await prisma.service.findUnique({
    where: {
      id,
    },
    include: {
      provider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      },
      photos: true,
    },
  });

  if (!service) throw new Error('SERVICE_NOT_FOUND');

  return service;
};

// Récupère les services actifs appartenant à un prestataire.
export const getMyServices = async (providerId: number) => {
  return await prisma.service.findMany({
    where: {
      providerId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      photos: {
        where: {
          isMain: true,
        },
        take: 1,
      },
    },
  });
};

// Désactive un service appartenant au prestataire.
export const deleteService = async (
  id: number,
  providerId: number
) => {
  const service = await prisma.service.findUnique({
    where: {
      id,
    },
  });

  if (!service) throw new Error('SERVICE_NOT_FOUND');

  // Vérifie que le service appartient bien au prestataire connecté.
  if (service.providerId !== providerId) {
    throw new Error('FORBIDDEN');
  }

  // Le service est désactivé au lieu d'être supprimé définitivement.
  await prisma.service.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return {
    message: 'Service supprimé avec succès',
  };
};

// Met à jour un service appartenant au prestataire.
export const updateService = async (
  id: number,
  providerId: number,
  data: {
    name?: string;
    category?: string;
    description?: string;
    price?: number;
  }
) => {
  const service = await prisma.service.findUnique({
    where: {
      id,
    },
  });

  if (!service) throw new Error('SERVICE_NOT_FOUND');

  // Vérifie que le service appartient bien au prestataire connecté.
  if (service.providerId !== providerId) {
    throw new Error('FORBIDDEN');
  }

  return await prisma.service.update({
    where: {
      id,
    },
    data,
  });
};

// Ajoute une photo à un service appartenant au prestataire.
export const uploadServicePhoto = async (
  serviceId: number,
  providerId: number,
  fileBuffer: Buffer,
  isMain: boolean = false
) => {
  // Vérifie que le service existe et appartient au prestataire.
  const service = await prisma.service.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!service) throw new Error('SERVICE_NOT_FOUND');

  if (service.providerId !== providerId) {
    throw new Error('FORBIDDEN');
  }

  // Retire le statut principal des autres photos si nécessaire.
  if (isMain) {
    await prisma.servicePhoto.updateMany({
      where: {
        serviceId,
      },
      data: {
        isMain: false,
      },
    });
  }

  // Envoie l'image vers Cloudinary.
  const uploadResult = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'evently/services',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error);
          } else {
            resolve(result as any);
          }
        }
      )
      .end(fileBuffer);
  });

  // Enregistre les informations de la photo en base de données.
  const photo = await prisma.servicePhoto.create({
    data: {
      serviceId,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      isMain,
    },
  });

  return photo;
};