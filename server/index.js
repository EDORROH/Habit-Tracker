// ...existing code...
// ...existing code...
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const mongoUri = 'mongodb+srv://ellerydorroh:nquVumKbdnEVziiC@cluster0.ml4ceao.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });


const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  passwordHash: String
});
const User = mongoose.model('User', userSchema);

const userStateSchema = new mongoose.Schema({
  userId: String,
  state: Object
});
const UserState = mongoose.model('UserState', userStateSchema);
// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const existing = await User.findOne({ username });
  if (existing) return res.status(409).json({ error: 'Username already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ username, passwordHash });
  await user.save();
  res.json({ success: true });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get user state (protected)
app.get('/api/state/:userId', auth, async (req, res) => {
  if (req.user.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  const user = await UserState.findOne({ userId: req.params.userId });
  if (user) {
    res.json(user.state);
  } else {
    res.json(null);
  }
});

// Save/update user state (protected)
app.post('/api/state/:userId', auth, async (req, res) => {
  if (req.user.userId !== req.params.userId) return res.status(403).json({ error: 'Forbidden' });
  const state = req.body;
  let user = await UserState.findOne({ userId: req.params.userId });
  if (user) {
    user.state = state;
    await user.save();
  } else {
    user = new UserState({ userId: req.params.userId, state });
    await user.save();
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
