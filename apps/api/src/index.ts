import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './modules/auth/auth.routes';
import venueRoutes from './modules/venues/venue.routes';
import serviceRoutes from './modules/services/service.routes';
import serviceBookingRoutes from './modules/services/service-booking.routes';
import reservationRoutes from './modules/reservations/reservation.routes';
import messageRoutes from './modules/messages/message.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import adminRoutes from './modules/admin/admin.routes';

import { initSocket } from './modules/socket/socket.handler';

// Initialise l'application Express et le serveur HTTP.
const app = express();
const httpServer = createServer(app);

// Définit l'URL du frontend autorisée à communiquer avec l'API.
const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:3000';

// Configure le serveur Socket.IO et les origines autorisées.
const io = new Server(httpServer, {
  cors: {
    origin: [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Ajoute les en-têtes de sécurité HTTP.
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

// Configure les règles CORS pour les requêtes HTTP.
app.use(
  cors({
    origin: [
      FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Permet à Express de lire les corps de requêtes au format JSON.
app.use(express.json());

// Endpoint permettant de vérifier que l'API fonctionne correctement.
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Evently API',
    timestamp: new Date(),
  });
});

// Enregistre les différentes routes de l'API.
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-bookings', serviceBookingRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Initialise la communication en temps réel avec Socket.IO.
initSocket(io);

// Démarre le serveur HTTP sur le port configuré.
const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(
    `API Evently démarrée sur http://localhost:${PORT}`
  );
});