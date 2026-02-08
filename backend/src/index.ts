import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './prisma/client';

// Import routes
import authRoutes from './routes/auth';
import drinksRoutes from './routes/drinks';
import entriesRoutes from './routes/entries';
import statsRoutes from './routes/stats';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Alcohol Tracker API is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/drinks', drinksRoutes);
app.use('/entries', entriesRoutes);
app.use('/stats', statsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
