import { prismaTest } from "./setup";
import * as authService from "../modules/auth/auth.service";
import bcrypt from "bcrypt";

// On mock l'envoi d'email pour ne pas envoyer de vrais emails pendant les tests
jest.mock("../utils/mailer", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(true),
}));

describe("Auth Service", () => {
  // ─────────────────────────────────────────
  // Inscription (registerUser)
  // ─────────────────────────────────────────
  describe("registerUser", () => {
    it("doit créer un nouvel utilisateur avec succès", async () => {
      const result = await authService.registerUser({
        email: "client.test@evently.com",
        password: "MotDePasse123!",
        firstName: "Jean",
        lastName: "Dupont",
        role: "CLIENT",
      });

      expect(result).toHaveProperty("userId");

      const user = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      expect(user).not.toBeNull();
      expect(user?.isVerified).toBe(false);
      expect(user?.role).toBe("CLIENT");
      expect(user?.otpCode).toHaveLength(6);
    });

    it("doit rejeter une inscription avec un email déjà utilisé", async () => {
      await expect(
        authService.registerUser({
          email: "client.test@evently.com",
          password: "AutreMotDePasse123!",
          firstName: "Paul",
          lastName: "Martin",
          role: "CLIENT",
        })
      ).rejects.toThrow("EMAIL_ALREADY_EXISTS");
    });

    it("doit hasher le mot de passe avec bcrypt", async () => {
      const user = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      const isMatch = await bcrypt.compare("MotDePasse123!", user!.password);
      expect(isMatch).toBe(true);
    });
  });

  // ─────────────────────────────────────────
  // Vérification OTP (verifyOtp)
  // ─────────────────────────────────────────
  describe("verifyOtp", () => {
    it("doit vérifier un compte avec un code OTP correct", async () => {
      const user = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      const result = await authService.verifyOtp(user!.id, user!.otpCode!);

      expect(result).toHaveProperty("message");

      const updatedUser = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      expect(updatedUser?.isVerified).toBe(true);
      expect(updatedUser?.otpCode).toBeNull();
    });

    it("doit rejeter un code OTP incorrect", async () => {
      await authService.registerUser({
        email: "otp.test@evently.com",
        password: "MotDePasse123!",
        firstName: "Sophie",
        lastName: "Bernard",
        role: "CLIENT",
      });

      const user = await prismaTest.user.findUnique({
        where: { email: "otp.test@evently.com" },
      });

      await expect(
        authService.verifyOtp(user!.id, "000000")
      ).rejects.toThrow("INVALID_OTP");
    });

    it("doit rejeter un userId inexistant", async () => {
      await expect(
        authService.verifyOtp(999999, "123456")
      ).rejects.toThrow("USER_NOT_FOUND");
    });
  });

  // ─────────────────────────────────────────
  // Connexion (loginUser)
  // ─────────────────────────────────────────
  describe("loginUser", () => {
    it("doit connecter un utilisateur vérifié avec les bons identifiants", async () => {
      const result = await authService.loginUser(
        "client.test@evently.com",
        "MotDePasse123!"
      );

      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe("client.test@evently.com");
      expect(result.user.role).toBe("CLIENT");
    });

    it("doit rejeter une connexion avec un mauvais mot de passe", async () => {
      await expect(
        authService.loginUser("client.test@evently.com", "MauvaisMotDePasse")
      ).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("doit rejeter une connexion pour un compte non vérifié", async () => {
      await expect(
        authService.loginUser("otp.test@evently.com", "MotDePasse123!")
      ).rejects.toThrow("EMAIL_NOT_VERIFIED");
    });

    it("doit rejeter une connexion pour un email inexistant", async () => {
      await expect(
        authService.loginUser("inconnu@evently.com", "MotDePasse123!")
      ).rejects.toThrow("INVALID_CREDENTIALS");
    });
  });

  // ─────────────────────────────────────────
  // Mise à jour du profil (updateProfile)
  // ─────────────────────────────────────────
  describe("updateProfile", () => {
    it("doit mettre à jour le prénom et le nom", async () => {
      const user = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      const updated = await authService.updateProfile(user!.id, {
        firstName: "Jean-Marc",
        lastName: "Dupont-Durand",
      });

      expect(updated.firstName).toBe("Jean-Marc");
      expect(updated.lastName).toBe("Dupont-Durand");
    });

    it("doit rejeter le changement de mot de passe si l'ancien est incorrect", async () => {
      const user = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      await expect(
        authService.updateProfile(user!.id, {
          currentPassword: "MauvaisAncienMotDePasse",
          newPassword: "NouveauMotDePasse123!",
        })
      ).rejects.toThrow("WRONG_PASSWORD");
    });

    it("doit changer le mot de passe avec succès", async () => {
      const user = await prismaTest.user.findUnique({
        where: { email: "client.test@evently.com" },
      });

      await authService.updateProfile(user!.id, {
        currentPassword: "MotDePasse123!",
        newPassword: "NouveauMotDePasse123!",
      });

      const result = await authService.loginUser(
        "client.test@evently.com",
        "NouveauMotDePasse123!"
      );

      expect(result).toHaveProperty("token");
    });
  });
});