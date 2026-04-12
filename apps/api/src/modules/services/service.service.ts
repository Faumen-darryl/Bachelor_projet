import { prisma } from '../../lib/prisma';

interface ServiceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export const createService = async (providerId: number, data: {
  name: string;
  category: string;
  description: string;
  price: number;
}) => {
  return await prisma.service.create({
    data: { ...data, providerId },
    include: { provider: { select: { id: true, firstName: true, lastName: true } } },
  });
};

export const getServices = async (filters: ServiceFilters) => {
  const { category, minPrice, maxPrice, page = 1, limit = 12 } = filters;

  const where: any = { isActive: true };
  if (category) where.category = { contains: category };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { id: true, firstName: true, lastName: true } },
        photos: { where: { isMain: true }, take: 1 },
      },
    }),
    prisma.service.count({ where }),
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

export const getServiceById = async (id: number) => {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      provider: { select: { id: true, firstName: true, lastName: true, phone: true } },
      photos: true,
    },
  });
  if (!service) throw new Error('SERVICE_NOT_FOUND');
  return service;
};