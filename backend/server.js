import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import documentRoutes from './routes/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// API Routes
app.use('/', documentRoutes);

// Serve React frontend in production
if (isProduction) {
  const frontendBuild = join(__dirname, 'public');
  if (existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild));
    // Catch-all: return React app for any non-API route
    app.get('*', (req, res) => {
      res.sendFile(join(frontendBuild, 'index.html'));
    });
  }
}

// Database connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('MongoDB connection error:', err);
});
