import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './modules/auth/auth.routes';
import venueRoutes from './modules/venues/venue.routes';
import serviceRoutes from './modules/services/service.routes';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] },
});

app.use(helmet());
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Evently API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/services', serviceRoutes);

io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 API Evently démarrée sur http://localhost:${PORT}`);
});