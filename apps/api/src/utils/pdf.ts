import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface InvoiceData {
  reservationId: number;
  clientName: string;
  clientEmail: string;
  venueName: string;
  startAt: Date;
  endAt: Date;
  services: { name: string; price: number; quantity: number }[];
  totalAmount: number;
  deposit: number;
  paidAt: Date;
}

export const generateInvoicePdf = (data: InvoiceData): Buffer => {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // En-tête
    doc.fontSize(24).fillColor('#6C63FF').text('EVENTLY', 50, 50);
    doc.fontSize(10).fillColor('#888').text('Plateforme de gestion d\'événements', 50, 80);

    doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#6C63FF').stroke();

    // Titre facture
    doc.fontSize(20).fillColor('#333').text('FACTURE', 50, 120);
    doc.fontSize(10).fillColor('#888')
      .text(`Réservation #${data.reservationId}`, 50, 148)
      .text(`Date : ${data.paidAt.toLocaleDateString('fr-FR')}`, 50, 162);

    // Infos client
    doc.fontSize(12).fillColor('#333').text('Facturer à :', 50, 200);
    doc.fontSize(10).fillColor('#555')
      .text(data.clientName, 50, 218)
      .text(data.clientEmail, 50, 233);

    // Détail prestation
    doc.fontSize(12).fillColor('#333').text('Détail de la prestation', 50, 280);
    doc.moveTo(50, 298).lineTo(550, 298).strokeColor('#ddd').stroke();

    let y = 310;

    // Lieu
    doc.fontSize(10).fillColor('#555')
      .text(data.venueName, 50, y)
      .text(`${data.startAt.toLocaleDateString('fr-FR')} → ${data.endAt.toLocaleDateString('fr-FR')}`, 200, y)
      .text(`${data.totalAmount} €`, 480, y, { align: 'right' });

    y += 20;

    // Services additionnels
    data.services.forEach((s) => {
      doc.text(`${s.name} x${s.quantity}`, 50, y)
        .text(`${s.price} €`, 480, y, { align: 'right' });
      y += 18;
    });

    doc.moveTo(50, y + 10).lineTo(550, y + 10).strokeColor('#ddd').stroke();

    // Total
    y += 25;
    doc.fontSize(12).fillColor('#333')
      .text('Acompte versé :', 50, y)
      .text(`${data.deposit} €`, 480, y, { align: 'right' });

    y += 20;
    doc.fontSize(14).fillColor('#6C63FF')
      .text('TOTAL :', 50, y)
      .text(`${data.totalAmount} €`, 480, y, { align: 'right' });

    // Pied de page
    doc.fontSize(9).fillColor('#aaa')
      .text('Merci de votre confiance — Evently', 50, 700, { align: 'center' });

    doc.end();
  }) as unknown as Buffer;
};