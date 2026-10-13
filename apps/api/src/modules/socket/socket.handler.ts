import { Server, Socket } from 'socket.io';

import { verifyToken } from '../../utils/jwt';
import { prisma } from '../../lib/prisma';

// Initialise la gestion des connexions Socket.IO.
export const initSocket = (io: Server) => {
  // Vérifie le token transmis lors de la connexion Socket.IO.
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token manquant'));
    }

    try {
      const payload = verifyToken(token);

      (socket as any).user = payload;

      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  // Gère les événements déclenchés après la connexion d'un utilisateur.
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;

    console.log(`User ${user.userId} connecté via Socket`);

    // Ajoute l'utilisateur à sa room personnelle.
    socket.join(`user:${user.userId}`);

    // Ajoute l'utilisateur à la room liée à une réservation.
    socket.on('join:reservation', (reservationId: number) => {
      socket.join(`reservation:${reservationId}`);

      console.log(
        `User ${user.userId} a rejoint reservation:${reservationId}`
      );
    });

    // Enregistre et diffuse un nouveau message.
    socket.on(
      'message:send',
      async (data: {
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
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          });

          // Diffuse le message aux utilisateurs présents dans la conversation.
          io.to(`reservation:${data.reservationId}`).emit(
            'message:received',
            message
          );

          // Crée une notification pour le destinataire.
          await prisma.notification.create({
            data: {
              userId: data.receiverId,
              type: 'MESSAGE',
              title: 'Nouveau message',
              content: `${message.sender.firstName} vous a envoyé un message.`,
            },
          });

          // Envoie la notification en temps réel au destinataire.
          io.to(`user:${data.receiverId}`).emit('notification:new', {
            type: 'MESSAGE',
            title: 'Nouveau message',
            content: `${message.sender.firstName} vous a envoyé un message.`,
          });
        } catch (err) {
          socket.emit('error', {
            message: 'Erreur lors de l\'envoi du message',
          });
        }
      }
    );

    // Marque comme lus les messages reçus dans une réservation.
    socket.on('message:read', async (reservationId: number) => {
      await prisma.message.updateMany({
        where: {
          reservationId,
          receiverId: user.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      // Informe les autres participants que les messages ont été lus.
      socket.to(`reservation:${reservationId}`).emit('message:read', {
        reservationId,
        readBy: user.userId,
      });
    });

    // Journalise la déconnexion de l'utilisateur.
    socket.on('disconnect', () => {
      console.log(`User ${user.userId} déconnecté`);
    });
  });
};