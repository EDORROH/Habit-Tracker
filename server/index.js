import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/habittracker';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  userId: String,
  state: Object
});
const UserState = mongoose.model('UserState', userSchema);

// Get user state
app.get('/api/state/:userId', async (req, res) => {
  const userId = req.params.userId;
  const user = await UserState.findOne({ userId });
  if (user) {
    res.json(user.state);
  } else {
    res.json(null);
  }
});

// Save/update user state
app.post('/api/state/:userId', async (req, res) => {
  const userId = req.params.userId;
  const state = req.body;
  let user = await UserState.findOne({ userId });
  if (user) {
    user.state = state;
    await user.save();
  } else {
    user = new UserState({ userId, state });
    await user.save();
  }
  res.json({ success: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
