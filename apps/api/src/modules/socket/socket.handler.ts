import { Server, Socket } from 'socket.io';
import { verifyToken } from '../../utils/jwt';
import { prisma } from '../../lib/prisma';

export const initSocket = (io: Server) => {
  // Middleware auth Socket
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token manquant'));
    try {
      const payload = verifyToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`✅ User ${user.userId} connecté via Socket`);

    // Rejoindre la room personnelle
    socket.join(`user:${user.userId}`);

    // Rejoindre le chat d'une réservation
    socket.on('join:reservation', (reservationId: number) => {
      socket.join(`reservation:${reservationId}`);
      console.log(`User ${user.userId} a rejoint reservation:${reservationId}`);
    });

    // Envoyer un message
    socket.on('message:send', async (data: {
      reservationId: number;
      receiverId: number;
      content: string;
    }) => {
      try {
        const message = await prisma.message.create({
          data: {
            senderId: user.userId,
            receiverId: data.receiverId,
            reservationId: data.reservationId,
            content: data.content,
          },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        });

        // Diffuser le message dans la room
        io.to(`reservation:${data.reservationId}`).emit('message:received', message);

        // Notifier le destinataire
        await prisma.notification.create({
          data: {
            userId: data.receiverId,
            type: 'MESSAGE',
            title: 'Nouveau message',
            content: `${message.sender.firstName} vous a envoyé un message.`,
          },
        });

        io.to(`user:${data.receiverId}`).emit('notification:new', {
          type: 'MESSAGE',
          title: 'Nouveau message',
          content: `${message.sender.firstName} vous a envoyé un message.`,
        });
      } catch (err) {
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Marquer messages comme lus
    socket.on('message:read', async (reservationId: number) => {
      await prisma.message.updateMany({
        where: {
          reservationId,
          receiverId: user.userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      socket.to(`reservation:${reservationId}`).emit('message:read', {
        reservationId,
        readBy: user.userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User ${user.userId} déconnecté`);
    });
  });
};