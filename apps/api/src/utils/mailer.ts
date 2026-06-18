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