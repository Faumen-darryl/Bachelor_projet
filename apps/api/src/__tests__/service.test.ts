import { prismaTest } from "./setup";
import * as serviceService from "../modules/services/service.service";

describe("Service Service", () => {
  let providerId: number;
  let serviceId: number;

  // Créer un prestataire avant tous les tests
  beforeAll(async () => {
    const provider = await prismaTest.user.create({
      data: {
        email: "prestataire.service@evently.com",
        password: "hashed_password_fake",
        firstName: "Lucas",
        lastName: "Bernard",
        role: "PRESTATAIRE",
        isVerified: true,
      },
    });
    providerId = provider.id;
  });

  // ─────────────────────────────────────────
  // createService
  // ─────────────────────────────────────────
  describe("createService", () => {
    it("doit créer un service avec succès", async () => {
      const service = await serviceService.createService(providerId, {
        name: "DJ Résidence",
        category: "DJ",
        description: "DJ professionnel pour soirées électro et house",
        price: 800,
      });

      expect(service).toHaveProperty("id");
      expect(service.name).toBe("DJ Résidence");
      expect(service.providerId).toBe(providerId);
      expect(service.isActive).toBe(true);

      serviceId = service.id;
    });
  });

  // ─────────────────────────────────────────
  // getServices
  // ─────────────────────────────────────────
  describe("getServices", () => {
    it("doit retourner la liste des services avec pagination", async () => {
      const result = await serviceService.getServices({});

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toHaveProperty("total");
      expect(result.meta).toHaveProperty("totalPages");
    });

    it("doit filtrer les services par catégorie", async () => {
      const result = await serviceService.getServices({ category: "DJ" });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((s) => {
        expect(s.category.toLowerCase()).toContain("dj");
      });
    });

    it("ne doit retourner aucun service pour une catégorie inexistante", async () => {
      const result = await serviceService.getServices({ category: "CategorieInexistanteXYZ" });

      expect(result.data.length).toBe(0);
      expect(result.meta.total).toBe(0);
    });

    it("doit filtrer les services par fourchette de prix", async () => {
      const result = await serviceService.getServices({ minPrice: 500, maxPrice: 1000 });

      result.data.forEach((s) => {
        expect(Number(s.price)).toBeGreaterThanOrEqual(500);
        expect(Number(s.price)).toBeLessThanOrEqual(1000);
      });
    });
  });

  // ─────────────────────────────────────────
  // getServiceById
  // ─────────────────────────────────────────
  describe("getServiceById", () => {
    it("doit retourner le service correspondant à l'id", async () => {
      const service = await serviceService.getServiceById(serviceId);

      expect(service.id).toBe(serviceId);
      expect(service.name).toBe("DJ Résidence");
      expect(service).toHaveProperty("provider");
      expect(service).toHaveProperty("photos");
    });

    it("doit lever une erreur si le service n'existe pas", async () => {
      await expect(serviceService.getServiceById(999999)).rejects.toThrow(
        "SERVICE_NOT_FOUND"
      );
    });
  });

  // ─────────────────────────────────────────
  // getMyServices
  // ─────────────────────────────────────────
  describe("getMyServices", () => {
    it("doit retourner uniquement les services du prestataire", async () => {
      const services = await serviceService.getMyServices(providerId);

      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);
      services.forEach((s) => {
        expect(s.providerId).toBe(providerId);
      });
    });

    it("doit retourner un tableau vide pour un prestataire sans service", async () => {
      const otherProvider = await prismaTest.user.create({
        data: {
          email: "prestataire.sans.service@evently.com",
          password: "hashed_password_fake",
          firstName: "Nina",
          lastName: "Petit",
          role: "PRESTATAIRE",
          isVerified: true,
        },
      });

      const services = await serviceService.getMyServices(otherProvider.id);
      expect(services).toEqual([]);
    });
  });

  // ─────────────────────────────────────────
  // updateService
  // ─────────────────────────────────────────
  describe("updateService", () => {
    it("doit mettre à jour un service par son prestataire", async () => {
      const updated = await serviceService.updateService(serviceId, providerId, {
        name: "DJ Résidence Premium",
        price: 950,
      });

      expect(updated.name).toBe("DJ Résidence Premium");
      expect(Number(updated.price)).toBe(950);
    });

    it("doit rejeter la modification par un autre prestataire", async () => {
      const otherProvider = await prismaTest.user.create({
        data: {
          email: "autre.prestataire.service@evently.com",
          password: "hashed_password_fake",
          firstName: "Karim",
          lastName: "Said",
          role: "PRESTATAIRE",
          isVerified: true,
        },
      });

      await expect(
        serviceService.updateService(serviceId, otherProvider.id, { name: "Hack" })
      ).rejects.toThrow("FORBIDDEN");
    });

    it("doit lever une erreur si le service n'existe pas", async () => {
      await expect(
        serviceService.updateService(999999, providerId, { name: "X" })
      ).rejects.toThrow("SERVICE_NOT_FOUND");
    });
  });

  // ─────────────────────────────────────────
  // deleteService
  // ─────────────────────────────────────────
  describe("deleteService", () => {
    it("doit désactiver le service (soft delete) par son prestataire", async () => {
      const result = await serviceService.deleteService(serviceId, providerId);

      expect(result).toHaveProperty("message");

      const service = await prismaTest.service.findUnique({ where: { id: serviceId } });
      expect(service?.isActive).toBe(false);
    });

    it("ne doit plus apparaître dans getServices après suppression", async () => {
      const result = await serviceService.getServices({});
      const found = result.data.find((s) => s.id === serviceId);
      expect(found).toBeUndefined();
    });

    it("doit rejeter la suppression par un autre prestataire", async () => {
      const service = await serviceService.createService(providerId, {
        name: "Service Test Suppression",
        category: "Traiteur",
        description: "Service temporaire pour test",
        price: 500,
      });

      const intruder = await prismaTest.user.create({
        data: {
          email: "intrus.service@evently.com",
          password: "hashed_password_fake",
          firstName: "Hugo",
          lastName: "Intrus",
          role: "PRESTATAIRE",
          isVerified: true,
        },
      });

      await expect(
        serviceService.deleteService(service.id, intruder.id)
      ).rejects.toThrow("FORBIDDEN");
    });
  });
});