import { prismaTest } from "./setup";
import * as serviceBookingService from "../modules/services/service-booking.service";

describe("Service Booking Service", () => {
  let clientId: number;
  let providerId: number;
  let serviceId: number;
  let bookingId: number;

  beforeAll(async () => {
    const client = await prismaTest.user.create({
      data: {
        email: "client.servicebooking@evently.com",
        password: "hashed_password_fake",
        firstName: "Darryl",
        lastName: "Nou'oufaumen",
        role: "CLIENT",
        isVerified: true,
      },
    });
    clientId = client.id;

    const provider = await prismaTest.user.create({
      data: {
        email: "prestataire.servicebooking@evently.com",
        password: "hashed_password_fake",
        firstName: "Karim",
        lastName: "Said",
        role: "PRESTATAIRE",
        isVerified: true,
      },
    });
    providerId = provider.id;

    const service = await prismaTest.service.create({
      data: {
        providerId,
        name: "DJ Résidence",
        category: "DJ",
        description: "DJ professionnel pour soirées",
        price: 800,
      },
    });
    serviceId = service.id;
  });

  // ─────────────────────────────────────────
  // bookService
  // ─────────────────────────────────────────
  describe("bookService", () => {
    it("doit créer une réservation de service avec calcul automatique du prix", async () => {
      const booking = await serviceBookingService.bookService(clientId, {
        serviceId,
        eventDate: "2026-08-15T00:00:00.000Z",
        eventEndDate: "2026-08-15T23:59:59.000Z",
        guestCount: 80,
        notes: "Anniversaire 40 ans",
      });

      expect(booking).toHaveProperty("id");
      expect(booking.clientId).toBe(clientId);
      expect(booking.serviceId).toBe(serviceId);
      expect(booking.status).toBe("EN_ATTENTE");
      expect(Number(booking.totalAmount)).toBe(800);
      expect(Number(booking.deposit)).toBe(240); // 30% de 800

      bookingId = booking.id;
    });

    it("doit rejeter une réservation sur un service inexistant", async () => {
      await expect(
        serviceBookingService.bookService(clientId, {
          serviceId: 999999,
          eventDate: "2026-09-01T00:00:00.000Z",
          eventEndDate: "2026-09-01T23:59:59.000Z",
          guestCount: 10,
        })
      ).rejects.toThrow("SERVICE_NOT_FOUND");
    });

    it("doit rejeter si le prestataire tente de réserver son propre service", async () => {
      await expect(
        serviceBookingService.bookService(providerId, {
          serviceId,
          eventDate: "2026-09-01T00:00:00.000Z",
          eventEndDate: "2026-09-01T23:59:59.000Z",
          guestCount: 10,
        })
      ).rejects.toThrow("CANNOT_BOOK_OWN_SERVICE");
    });

    it("doit rejeter une réservation sur un service désactivé", async () => {
      const inactiveService = await prismaTest.service.create({
        data: {
          providerId,
          name: "Service désactivé",
          category: "Traiteur",
          description: "Service inactif pour test",
          price: 500,
          isActive: false,
        },
      });

      await expect(
        serviceBookingService.bookService(clientId, {
          serviceId: inactiveService.id,
          eventDate: "2026-09-01T00:00:00.000Z",
          eventEndDate: "2026-09-01T23:59:59.000Z",
          guestCount: 10,
        })
      ).rejects.toThrow("SERVICE_NOT_AVAILABLE");
    });
  });

  // ─────────────────────────────────────────
  // getClientServiceBookings / getProviderServiceBookings
  // ─────────────────────────────────────────
  describe("getClientServiceBookings", () => {
    it("doit retourner les réservations du client", async () => {
      const bookings = await serviceBookingService.getClientServiceBookings(clientId);

      expect(Array.isArray(bookings)).toBe(true);
      expect(bookings.length).toBeGreaterThan(0);
      bookings.forEach((b) => {
        expect(b.clientId).toBe(clientId);
      });
    });
  });

  describe("getProviderServiceBookings", () => {
    it("doit retourner les réservations reçues par le prestataire", async () => {
      const bookings = await serviceBookingService.getProviderServiceBookings(providerId);

      expect(Array.isArray(bookings)).toBe(true);
      expect(bookings.length).toBeGreaterThan(0);
      bookings.forEach((b) => {
        expect(b.service.id).toBeDefined();
      });
    });
  });

  // ─────────────────────────────────────────
  // confirmServiceBooking
  // ─────────────────────────────────────────
  describe("confirmServiceBooking", () => {
    it("doit rejeter une action par un non-propriétaire du service", async () => {
      await expect(
        serviceBookingService.confirmServiceBooking(bookingId, clientId, "CONFIRMEE")
      ).rejects.toThrow("FORBIDDEN");
    });

    it("doit rejeter si la réservation n'existe pas", async () => {
      await expect(
        serviceBookingService.confirmServiceBooking(999999, providerId, "CONFIRMEE")
      ).rejects.toThrow("BOOKING_NOT_FOUND");
    });

    it("doit permettre au prestataire de confirmer une réservation EN_ATTENTE", async () => {
      const result = await serviceBookingService.confirmServiceBooking(
        bookingId,
        providerId,
        "CONFIRMEE"
      );

      expect(result).toHaveProperty("message");

      const booking = await prismaTest.serviceBooking.findUnique({
        where: { id: bookingId },
      });
      expect(booking?.status).toBe("CONFIRMEE");
    });

    it("doit rejeter une nouvelle action si déjà traitée", async () => {
      await expect(
        serviceBookingService.confirmServiceBooking(bookingId, providerId, "ANNULEE")
      ).rejects.toThrow("ALREADY_PROCESSED");
    });

    it("doit permettre au prestataire de refuser une réservation avec un motif", async () => {
      const newBooking = await serviceBookingService.bookService(clientId, {
        serviceId,
        eventDate: "2026-10-01T00:00:00.000Z",
        eventEndDate: "2026-10-01T23:59:59.000Z",
        guestCount: 30,
      });

      const result = await serviceBookingService.confirmServiceBooking(
        newBooking.id,
        providerId,
        "ANNULEE",
        "Indisponible à cette date"
      );

      expect(result).toHaveProperty("message");

      const booking = await prismaTest.serviceBooking.findUnique({
        where: { id: newBooking.id },
      });
      expect(booking?.status).toBe("ANNULEE");
    });
  });

  // ─────────────────────────────────────────
  // cancelServiceBooking
  // ─────────────────────────────────────────
  describe("cancelServiceBooking", () => {
    let cancellableBookingId: number;

    beforeAll(async () => {
      const booking = await serviceBookingService.bookService(clientId, {
        serviceId,
        eventDate: "2026-11-01T00:00:00.000Z",
        eventEndDate: "2026-11-01T23:59:59.000Z",
        guestCount: 25,
      });
      cancellableBookingId = booking.id;
    });

    it("doit permettre au client d'annuler sa réservation", async () => {
      const result = await serviceBookingService.cancelServiceBooking(
        cancellableBookingId,
        clientId
      );

      expect(result).toHaveProperty("message");

      const booking = await prismaTest.serviceBooking.findUnique({
        where: { id: cancellableBookingId },
      });
      expect(booking?.status).toBe("ANNULEE");
    });

    it("doit rejeter l'annulation par un autre utilisateur", async () => {
      const booking = await serviceBookingService.bookService(clientId, {
        serviceId,
        eventDate: "2026-12-01T00:00:00.000Z",
        eventEndDate: "2026-12-01T23:59:59.000Z",
        guestCount: 12,
      });

      await expect(
        serviceBookingService.cancelServiceBooking(booking.id, providerId)
      ).rejects.toThrow("FORBIDDEN");
    });

    it("doit rejeter si la réservation n'existe pas", async () => {
      await expect(
        serviceBookingService.cancelServiceBooking(999999, clientId)
      ).rejects.toThrow("BOOKING_NOT_FOUND");
    });
  });

  // ─────────────────────────────────────────
  // Messagerie : sendServiceMessage / getServiceBookingMessages
  // ─────────────────────────────────────────
  describe("sendServiceMessage", () => {
    it("doit permettre au client d'envoyer un message au prestataire", async () => {
      const message = await serviceBookingService.sendServiceMessage(
        clientId,
        bookingId,
        "Bonjour, pouvez-vous prévoir une playlist personnalisée ?"
      );

      expect(message).toHaveProperty("id");
      expect(message.senderId).toBe(clientId);
      expect(message.receiverId).toBe(providerId);
      expect(message.content).toBe("Bonjour, pouvez-vous prévoir une playlist personnalisée ?");
      expect(message.isRead).toBe(false);
    });

    it("doit permettre au prestataire de répondre au client", async () => {
      const message = await serviceBookingService.sendServiceMessage(
        providerId,
        bookingId,
        "Bien sûr, envoyez-moi votre liste de titres !"
      );

      expect(message.senderId).toBe(providerId);
      expect(message.receiverId).toBe(clientId);
    });

    it("doit rejeter si la réservation n'existe pas", async () => {
      await expect(
        serviceBookingService.sendServiceMessage(clientId, 999999, "Test")
      ).rejects.toThrow("BOOKING_NOT_FOUND");
    });
  });

  describe("getServiceBookingMessages", () => {
    it("doit retourner les messages dans l'ordre chronologique", async () => {
      const messages = await serviceBookingService.getServiceBookingMessages(
        bookingId,
        clientId
      );

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(2);
      expect(messages[0].content).toContain("playlist personnalisée");
      expect(messages[1].content).toContain("liste de titres");
    });

    it("doit marquer les messages reçus comme lus à l'ouverture", async () => {
      // Le client ouvre la conversation : le message du prestataire (non lu) doit passer à isRead=true
      await serviceBookingService.getServiceBookingMessages(bookingId, clientId);

      const messages = await prismaTest.serviceMessage.findMany({
        where: { serviceBookingId: bookingId, receiverId: clientId },
      });

      messages.forEach((m) => {
        expect(m.isRead).toBe(true);
      });
    });

    it("doit rejeter l'accès pour un utilisateur non concerné", async () => {
      const intruder = await prismaTest.user.create({
        data: {
          email: "intrus.servicebooking@evently.com",
          password: "hashed_password_fake",
          firstName: "Hugo",
          lastName: "Intrus",
          role: "CLIENT",
          isVerified: true,
        },
      });

      await expect(
        serviceBookingService.getServiceBookingMessages(bookingId, intruder.id)
      ).rejects.toThrow("FORBIDDEN");
    });

    it("doit rejeter si la réservation n'existe pas", async () => {
      await expect(
        serviceBookingService.getServiceBookingMessages(999999, clientId)
      ).rejects.toThrow("BOOKING_NOT_FOUND");
    });
  });

  // ─────────────────────────────────────────
  // getServiceConversations
  // ─────────────────────────────────────────
  describe("getServiceConversations", () => {
    it("doit retourner les conversations du client avec le bon interlocuteur", async () => {
      const conversations = await serviceBookingService.getServiceConversations(clientId);

      expect(Array.isArray(conversations)).toBe(true);
      expect(conversations.length).toBeGreaterThan(0);

      const conv = conversations.find((c) => c.bookingId === bookingId);
      expect(conv).toBeDefined();
      expect(conv?.type).toBe("SERVICE");
      expect(conv?.isClient).toBe(true);
      expect(conv?.otherUser.id).toBe(providerId);
      expect(conv?.lastMessage).not.toBeNull();
    });

    it("doit retourner les conversations du prestataire avec le bon interlocuteur", async () => {
      const conversations = await serviceBookingService.getServiceConversations(providerId);

      const conv = conversations.find((c) => c.bookingId === bookingId);
      expect(conv).toBeDefined();
      expect(conv?.isClient).toBe(false);
      expect(conv?.otherUser.id).toBe(clientId);
    });

    it("doit retourner unreadCount = 0 pour le client après lecture", async () => {
      const conversations = await serviceBookingService.getServiceConversations(clientId);

      const conv = conversations.find((c) => c.bookingId === bookingId);
      expect(conv?.unreadCount).toBe(0);
    });

    it("doit retourner unreadCount > 0 pour le prestataire (messages non lus)", async () => {
      // Avant ce test, le prestataire a déjà 1 message non lu (le tout premier,
      // "playlist personnalisée", jamais ouvert par lui).
      // On envoie un second message du client vers le prestataire.
      await serviceBookingService.sendServiceMessage(
        clientId,
        bookingId,
        "Encore une question : à quelle heure arrivez-vous ?"
      );

      const conversations = await serviceBookingService.getServiceConversations(providerId);
      const conv = conversations.find((c) => c.bookingId === bookingId);

      // Le prestataire n'a jamais ouvert la conversation : il a donc
      // 2 messages non lus au total (le premier message du client + celui-ci)
      expect(conv?.unreadCount).toBe(2);
    });

    it("ne doit retourner aucune conversation sans message échangé", async () => {
      const newClient = await prismaTest.user.create({
        data: {
          email: "client.sans.message@evently.com",
          password: "hashed_password_fake",
          firstName: "Nina",
          lastName: "Petit",
          role: "CLIENT",
          isVerified: true,
        },
      });

      // Réservation sans aucun message échangé
      await serviceBookingService.bookService(newClient.id, {
        serviceId,
        eventDate: "2027-02-01T00:00:00.000Z",
        eventEndDate: "2027-02-01T23:59:59.000Z",
        guestCount: 5,
      });

      const conversations = await serviceBookingService.getServiceConversations(newClient.id);
      expect(conversations.length).toBe(0);
    });
  });
});