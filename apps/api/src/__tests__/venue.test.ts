import { prismaTest } from "./setup";
import * as venueService from "../modules/venues/venue.service";

describe("Venue Service", () => {
  let ownerId: number;
  let venueId: number;

  // Créer un prestataire propriétaire avant tous les tests
  beforeAll(async () => {
    const owner = await prismaTest.user.create({
      data: {
        email: "prestataire.venue@evently.com",
        password: "hashed_password_fake",
        firstName: "Marie",
        lastName: "Durand",
        role: "PRESTATAIRE",
        isVerified: true,
      },
    });
    ownerId = owner.id;
  });

  // ─────────────────────────────────────────
  // createVenue
  // ─────────────────────────────────────────
  describe("createVenue", () => {
    it("doit créer un lieu avec succès", async () => {
      const venue = await venueService.createVenue(ownerId, {
        name: "Villa des Jardins",
        description: "Une magnifique villa avec jardin pour vos événements",
        type: "JARDIN",
        capacity: 150,
        pricePerHour: 200,
        city: "Aix-en-Provence",
        address: "12 rue des Lilas",
        hasActivity: false,
      });

      expect(venue).toHaveProperty("id");
      expect(venue.name).toBe("Villa des Jardins");
      expect(venue.ownerId).toBe(ownerId);
      expect(venue.isActive).toBe(true);

      venueId = venue.id;
    });
  });

  // ─────────────────────────────────────────
  // getVenues
  // ─────────────────────────────────────────
  describe("getVenues", () => {
    it("doit retourner la liste des lieux avec pagination", async () => {
      const result = await venueService.getVenues({});

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("meta");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.meta).toHaveProperty("total");
      expect(result.meta).toHaveProperty("totalPages");
    });

    it("doit filtrer les lieux par ville", async () => {
      const result = await venueService.getVenues({ city: "Aix-en-Provence" });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((v) => {
        expect(v.city.toLowerCase()).toContain("aix-en-provence");
      });
    });

    it("ne doit retourner aucun lieu pour une ville inexistante", async () => {
      const result = await venueService.getVenues({ city: "VilleInexistanteXYZ" });

      expect(result.data.length).toBe(0);
      expect(result.meta.total).toBe(0);
    });

    it("doit filtrer les lieux par capacité minimale", async () => {
      const result = await venueService.getVenues({ capacity: 100 });

      result.data.forEach((v) => {
        expect(v.capacity).toBeGreaterThanOrEqual(100);
      });
    });

    it("doit filtrer les lieux par type", async () => {
      const result = await venueService.getVenues({ type: "JARDIN" });

      result.data.forEach((v) => {
        expect(v.type).toBe("JARDIN");
      });
    });

    it("doit filtrer les lieux par fourchette de prix", async () => {
      const result = await venueService.getVenues({ minPrice: 100, maxPrice: 300 });

      result.data.forEach((v) => {
        expect(Number(v.pricePerHour)).toBeGreaterThanOrEqual(100);
        expect(Number(v.pricePerHour)).toBeLessThanOrEqual(300);
      });
    });
  });

  // ─────────────────────────────────────────
  // getVenueById
  // ─────────────────────────────────────────
  describe("getVenueById", () => {
    it("doit retourner le lieu correspondant à l'id", async () => {
      const venue = await venueService.getVenueById(venueId);

      expect(venue.id).toBe(venueId);
      expect(venue.name).toBe("Villa des Jardins");
      expect(venue).toHaveProperty("owner");
      expect(venue).toHaveProperty("photos");
      expect(venue).toHaveProperty("availabilities");
    });

    it("doit lever une erreur si le lieu n'existe pas", async () => {
      await expect(venueService.getVenueById(999999)).rejects.toThrow(
        "VENUE_NOT_FOUND"
      );
    });
  });

  // ─────────────────────────────────────────
  // updateVenue
  // ─────────────────────────────────────────
  describe("updateVenue", () => {
    it("doit mettre à jour un lieu par son propriétaire", async () => {
      const updated = await venueService.updateVenue(venueId, ownerId, {
        name: "Villa des Jardins - Rénovée",
        pricePerHour: 250,
      });

      expect(updated.name).toBe("Villa des Jardins - Rénovée");
      expect(Number(updated.pricePerHour)).toBe(250);
    });

    it("doit rejeter la modification par un autre utilisateur", async () => {
      const otherUser = await prismaTest.user.create({
        data: {
          email: "autre.prestataire@evently.com",
          password: "hashed_password_fake",
          firstName: "Paul",
          lastName: "Martin",
          role: "PRESTATAIRE",
          isVerified: true,
        },
      });

      await expect(
        venueService.updateVenue(venueId, otherUser.id, { name: "Hack" })
      ).rejects.toThrow("FORBIDDEN");
    });

    it("doit lever une erreur si le lieu n'existe pas", async () => {
      await expect(
        venueService.updateVenue(999999, ownerId, { name: "X" })
      ).rejects.toThrow("VENUE_NOT_FOUND");
    });
  });

  // ─────────────────────────────────────────
  // deleteVenue
  // ─────────────────────────────────────────
  describe("deleteVenue", () => {
    it("doit désactiver le lieu (soft delete) par son propriétaire", async () => {
      const result = await venueService.deleteVenue(venueId, ownerId);

      expect(result).toHaveProperty("message");

      const venue = await prismaTest.venue.findUnique({ where: { id: venueId } });
      expect(venue?.isActive).toBe(false);
    });

    it("ne doit plus apparaître dans getVenues après suppression", async () => {
      const result = await venueService.getVenues({});
      const found = result.data.find((v) => v.id === venueId);
      expect(found).toBeUndefined();
    });

    it("doit rejeter la suppression par un autre utilisateur", async () => {
      // Recréer un lieu actif pour ce test
      const venue = await venueService.createVenue(ownerId, {
        name: "Salle Test Suppression",
        description: "Lieu temporaire pour test",
        type: "SALLE",
        capacity: 50,
        pricePerHour: 100,
        city: "Lyon",
        address: "1 rue Test",
      });

      const otherUser = await prismaTest.user.create({
        data: {
          email: "intrus@evently.com",
          password: "hashed_password_fake",
          firstName: "Jacques",
          lastName: "Intrus",
          role: "PRESTATAIRE",
          isVerified: true,
        },
      });

      await expect(
        venueService.deleteVenue(venue.id, otherUser.id)
      ).rejects.toThrow("FORBIDDEN");
    });
  });
});