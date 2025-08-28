// ...existing code...
// ...existing code...
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// --- Health checks ---
// after: const app = express(); app.use(cors()); app.use(express.json());
app.get('/health', (req, res) => res.send('ok'));

app.get('/health/db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ ok: true, db: mongoose.connection.name });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// --- MongoDB connection (from .env) ---
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

try {
  // No need for useNewUrlParser/useUnifiedTopology on modern Mongoose
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
  console.log('Host:', mongoose.connection.host);
  console.log('DB name:', mongoose.connection.name);
} catch (err) {
  console.error('❌ Mongo connection failed');
  console.error('Name:', err.name);
  console.error('Code:', err.code);
  console.error('Message:', err.message);
  process.exit(1);
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
