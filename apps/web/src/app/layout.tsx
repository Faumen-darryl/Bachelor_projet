import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evently — Planifiez vos événements d\'exception',
  description: 'La plateforme de référence pour organiser vos événements. Trouvez les meilleurs lieux et prestataires.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}