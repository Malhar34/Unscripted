import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  id: String,
  name: String,
  role: String,
  motivation: String,
  isEliminated: { type: Boolean, default: false },
  isReady: { type: Boolean, default: false },
  walletAddress: String,
});

const phaseHistorySchema = new mongoose.Schema({
  phase: Number,
  plotReveal: String,
  audioUrl: String,
  actions: mongoose.Schema.Types.Mixed,
  votes: mongoose.Schema.Types.Mixed,
  eliminated: String,
});

const gameSchema = new mongoose.Schema({
  episodeId: { type: String, unique: true, required: true },
  status: { type: String, default: 'lobby' },
  genre: String,
  theme: String,
  setting: String,
  narratorIntro: String,
  narratorAudioUrl: String,
  players: [playerSchema],
  phase: { type: Number, default: 0 },
  maxPhases: { type: Number, default: 3 },
  phaseHistory: [phaseHistorySchema],
  currentPlotReveal: String,
  currentAudioUrl: String,
  votes: { type: mongoose.Schema.Types.Mixed, default: {} },
  actions: { type: mongoose.Schema.Types.Mixed, default: {} },
  currentChoices: [String],
  winner: String,
  winnerWalletAddress: String,
  rewardTxSignature: String,
  createdAt: { type: Date, default: Date.now },
});

export const Game = mongoose.model('Game', gameSchema);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Running without MongoDB persistence (in-memory only)');
  }
};
