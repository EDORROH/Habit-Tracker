// ...existing code...
// ...existing code...
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcryptjs from 'bcryptjs';  // Change from 'bcrypt' to 'bcryptjs'
import jwt from 'jsonwebtoken';

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const PORT = process.env.PORT || 4000;

// User Schema and Model //
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// State Schema and Model (add this after User model)
const stateSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: Object, default: {} }
}, { timestamps: true });

const State = mongoose.model('State', stateSchema);

// Root routes:
app.get('/', (req, res) => {
  res.json({ 
    message: 'Habit Tracker API is running!',
    endpoints: [
      'POST /auth/register',
      'POST /auth/login', 
      'GET /state/:userId',
      'POST /state/:userId'
    ]
  });
});

// Auth Routes
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Create user
    const user = new User({
      username,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, userId: user._id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check password
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, userId: user._id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});
// State Routes (add this after auth routes, before health checks)
app.get('/state/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can only access their own state
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let state = await State.findOne({ userId });
    if (!state) {
      // Create default state if none exists
      state = new State({
        userId,
        data: {
          history: {},
          xp: { dailyXP: 0, totalXP: 0 },
          streaks: { currentStreak: 0 },
          completedHabits: []
        }
      });
      await state.save();
    }
    
    res.json(state.data);
  } catch (error) {
    console.error('State GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/state/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const stateData = req.body;
    
    // Verify user can only update their own state
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let state = await State.findOne({ userId });
    if (!state) {
      state = new State({ userId, data: stateData });
    } else {
      state.data = stateData;
    }
    
    await state.save();
    res.json({ success: true });
  } catch (error) {
    console.error('State POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health checks
app.get('/health', (req, res) => res.send('ok'));

app.get('/health/db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ ok: true, db: mongoose.connection.name });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ Missing MONGODB_URI in .env');
  process.exit(1);
}

try {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
