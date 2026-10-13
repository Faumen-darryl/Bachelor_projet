import { prisma } from '../../lib/prisma';
import cloudinary from '../../lib/cloudinary';
import { VenueType } from '@prisma/client';

// Définit les filtres disponibles pour la recherche de lieux.
interface VenueFilters {
  city?: string;
  type?: VenueType;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  hasActivity?: boolean;
  page?: number;
  limit?: number;
}

// Crée un nouveau lieu pour un propriétaire.
export const createVenue = async (
  ownerId: number,
  data: {
    name: string;
    description: string;
    type: VenueType;
    capacity: number;
    pricePerHour: number;
    city: string;
    address: string;
    lat?: number;
    lng?: number;
    hasActivity?: boolean;
    equipments?: string;
    rules?: string;
  }
) => {
  return await prisma.venue.create({
    data: {
      ...data,
      ownerId,
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

// Récupère les lieux actifs selon les filtres et la pagination demandés.
export const getVenues = async (filters: VenueFilters) => {
  const {
    city,
    type,
    minPrice,
    maxPrice,
    capacity,
    hasActivity,
    page = 1,
    limit = 12,
  } = filters;

  const where: any = {
    isActive: true,
  };

  // Applique les différents filtres lorsqu'ils sont renseignés.
  if (city) {
    where.city = {
      contains: city,
    };
  }

  if (type) {
    where.type = type;
  }

  if (hasActivity !== undefined) {
    where.hasActivity = hasActivity;
  }

  if (capacity) {
    where.capacity = {
      gte: Number(capacity),
    };
  }

  // Applique les limites de prix lorsqu'elles sont renseignées.
  if (minPrice || maxPrice) {
    where.pricePerHour = {};

    if (minPrice) {
      where.pricePerHour.gte = Number(minPrice);
    }

    if (maxPrice) {
      where.pricePerHour.lte = Number(maxPrice);
    }
  }

  // Calcule le nombre de résultats à ignorer selon la page demandée.
  const skip = (Number(page) - 1) * Number(limit);

  // Récupère les lieux et leur nombre total en parallèle.
  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        owner: {
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

    prisma.venue.count({
      where,
    }),
  ]);

  return {
    data: venues,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// Récupère le détail d'un lieu à partir de son identifiant.
export const getVenueById = async (id: number) => {
  const venue = await prisma.venue.findUnique({
    where: {
      id,
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      photos: true,
      availabilities: {
        where: {
          date: {
            gte: new Date(),
          },
        },
        orderBy: {
          date: 'asc',
        },
        take: 30,
      },
    },
  });

  if (!venue) throw new Error('VENUE_NOT_FOUND');

  return venue;
};

// Met à jour un lieu appartenant à son propriétaire.
export const updateVenue = async (
  id: number,
  ownerId: number,
  data: any
) => {
  const venue = await prisma.venue.findUnique({
    where: {
      id,
    },
  });

  if (!venue) throw new Error('VENUE_NOT_FOUND');

  // Vérifie que le lieu appartient bien à l'utilisateur connecté.
  if (venue.ownerId !== ownerId) {
    throw new Error('FORBIDDEN');
  }

  return await prisma.venue.update({
    where: {
      id,
    },
    data,
    include: {
      photos: true,
    },
  });
};

// Désactive un lieu appartenant à son propriétaire.
export const deleteVenue = async (
  id: number,
  ownerId: number
) => {
  const venue = await prisma.venue.findUnique({
    where: {
      id,
    },
  });

  if (!venue) throw new Error('VENUE_NOT_FOUND');

  // Vérifie que le lieu appartient bien à l'utilisateur connecté.
  if (venue.ownerId !== ownerId) {
    throw new Error('FORBIDDEN');
  }

  // Le lieu est désactivé au lieu d'être supprimé définitivement.
  await prisma.venue.update({
    where: {
      id,
    },
    data: {
      isActive: false,
    },
  });

  return {
    message: 'Lieu supprimé avec succès',
  };
};

// Ajoute une photo à un lieu appartenant à son propriétaire.
export const uploadVenuePhoto = async (
  venueId: number,
  ownerId: number,
  fileBuffer: Buffer,
  isMain: boolean = false
) => {
  const venue = await prisma.venue.findUnique({
    where: {
      id: venueId,
    },
  });

  if (!venue) throw new Error('VENUE_NOT_FOUND');

  // Vérifie que le lieu appartient bien à l'utilisateur connecté.
  if (venue.ownerId !== ownerId) {
    throw new Error('FORBIDDEN');
  }

  // Envoie l'image vers Cloudinary avec une largeur maximale de 1200 pixels.
  const result = await new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `evently/venues/${venueId}`,
          transformation: [
            {
              width: 1200,
              crop: 'limit',
            },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(fileBuffer);
  });

  // Retire le statut principal des autres photos si nécessaire.
  if (isMain) {
    await prisma.venuePhoto.updateMany({
      where: {
        venueId,
      },
      data: {
        isMain: false,
      },
    });
  }

  // Enregistre les informations de la photo en base de données.
  return await prisma.venuePhoto.create({
    data: {
      venueId,
      url: result.secure_url,
      publicId: result.public_id,
      isMain,
    },
  });
};