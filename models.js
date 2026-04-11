import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { connectDB } from './models.js';
import {
  createGame, getGame, addPlayer, removePlayer,
  addBotPlayers, startEpisode, submitAction, castVote,
  beginVoting, resolvePhase,
} from './gameLogic.js';
import { getWalletBalance } from './solana.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

// Connect to MongoDB (non-blocking — game runs in memory if DB is unavailable)
connectDB();

// REST: create a new game lobby
app.post('/api/games', (req, res) => {
  const episodeId = nanoid(6).toUpperCase();
  const game = createGame(episodeId);
  res.json({ episodeId, game });
});

// REST: get current game state (for reconnecting)
app.get('/api/games/:episodeId', (req, res) => {
  const game = getGame(req.params.episodeId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

// REST: get SOL balance for a wallet
app.get('/api/wallet/:address/balance', async (req, res) => {
  const balance = await getWalletBalance(req.params.address);
  res.json({ balance });
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Socket.io — the real-time game events
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Player joins a lobby
  socket.on('join_game', ({ episodeId, playerName, walletAddress }) => {
    const game = getGame(episodeId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    socket.join(episodeId);
    socket.join(socket.id); // private room for role cards

    const updatedGame = addPlayer(episodeId, {
      id: socket.id,
      name: playerName || `Player_${socket.id.slice(0, 4)}`,
      walletAddress,
    });

    if (!updatedGame) {
      socket.emit('error', 'Could not join — game full or already started');
      return;
    }

    socket.data.episodeId = episodeId;
    io.to(episodeId).emit('game_state', updatedGame);
    io.to(episodeId).emit('player_joined', { name: playerName });
  });

  // Host starts the episode
  socket.on('start_episode', ({ episodeId, genre, addBots }) => {
    const game = getGame(episodeId);
    if (!game) return;

    if (addBots) {
      const needed = Math.max(0, 4 - game.players.length);
      addBotPlayers(episodeId, needed);
    }

    startEpisode(episodeId, genre, io);
  });

  // Player submits their action choice for this phase
  socket.on('submit_action', ({ episodeId, choiceIndex }) => {
    submitAction(episodeId, socket.id, choiceIndex, io);
  });

  // Player casts an accusation vote
  socket.on('cast_vote', ({ episodeId, targetId }) => {
    castVote(episodeId, socket.id, targetId, io);
  });

  // Host skips the vote timer (useful for demo)
  socket.on('force_resolve', ({ episodeId }) => {
    resolvePhase(episodeId, io);
  });

  // Player skips to voting manually
  socket.on('skip_to_vote', ({ episodeId }) => {
    beginVoting(episodeId, io);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const episodeId = socket.data?.episodeId;
    if (episodeId) {
      const game = removePlayer(episodeId, socket.id);
      if (game) io.to(episodeId).emit('game_state', game);
    }
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\nEpisodes server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health\n`);
});
