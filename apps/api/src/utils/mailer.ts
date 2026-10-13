import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (
  to: string,
  otp: string,
  firstName: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"Evently" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Votre code de vérification Evently',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #6C63FF;">Bienvenue sur Evently, ${firstName} !</h2>
        <p>Voici votre code de vérification :</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                    color: #6C63FF; text-align: center; padding: 24px 0;">
          ${otp}
        </div>
        <p style="color: #888;">Ce code expire dans <strong>10 minutes</strong>.</p>
      </div>
    `,
  });
};

export const sendResetPasswordEmail = async (
  email: string,
  firstName: string,
  resetLink: string
) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Evently" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe — Evently',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1E3A5F; margin-bottom: 8px;">Bonjour ${firstName},</h2>
        <p style="color: #444; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Evently</strong>.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}"
            style="background: #C9A96E; color: #fff; padding: 14px 32px;
            border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #888; font-size: 13px;">
          Ce lien est valable <strong>30 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">© 2026 Evently — Tous droits réservés</p>
      </div>
    `,
  });
};