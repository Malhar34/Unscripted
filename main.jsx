import { GAME_STATUS, createInitialGameState } from './gameTypes.js';
import { generateEpisode, advancePhase } from './aiEngine.js';
import { generateNarration } from './narrator.js';
import { sendWinnerReward } from './solana.js';

// In-memory store — also synced to MongoDB when available
export const games = new Map();

export const createGame = (episodeId) => {
  const state = createInitialGameState();
  state.episodeId = episodeId;
  state.createdAt = new Date();
  games.set(episodeId, state);
  return state;
};

export const getGame = (episodeId) => games.get(episodeId);

export const addPlayer = (episodeId, player) => {
  const game = games.get(episodeId);
  if (!game) return null;
  if (game.players.length >= 8) return null;
  if (game.status !== GAME_STATUS.LOBBY) return null;

  const newPlayer = {
    id: player.id,
    name: player.name,
    role: null,
    motivation: null,
    isEliminated: false,
    isReady: false,
    walletAddress: player.walletAddress || null,
    isBot: player.isBot || false,
  };
  game.players.push(newPlayer);
  return game;
};

export const removePlayer = (episodeId, playerId) => {
  const game = games.get(episodeId);
  if (!game) return null;
  game.players = game.players.filter(p => p.id !== playerId);
  return game;
};

// Fills empty slots with bot players for demo mode
export const addBotPlayers = (episodeId, count = 3) => {
  const botNames = ['Alex', 'Jordan', 'Morgan', 'Riley', 'Casey', 'Quinn'];
  const game = games.get(episodeId);
  if (!game) return null;

  const needed = Math.min(count, 8 - game.players.length);
  for (let i = 0; i < needed; i++) {
    const name = botNames[i % botNames.length];
    addPlayer(episodeId, {
      id: `bot_${i}_${Date.now()}`,
      name,
      isBot: true,
    });
  }
  return game;
};

// Starts the episode: calls Gemini to generate the premise, then ElevenLabs for audio
export const startEpisode = async (episodeId, genre, io) => {
  const game = games.get(episodeId);
  if (!game) return;

  game.status = GAME_STATUS.GENERATING;
  io.to(episodeId).emit('game_state', game);

  try {
    const playerNames = game.players.map(p => p.name);
    const episodeData = await generateEpisode(playerNames, genre || 'murder_mystery');

    // Assign roles back to players
    game.genre = genre;
    game.theme = episodeData.theme;
    game.setting = episodeData.setting;
    game.narratorIntro = episodeData.narratorIntro;
    game.currentChoices = episodeData.firstChoices;

    for (const player of game.players) {
      const assigned = episodeData.players.find(p => p.name === player.name);
      if (assigned) {
        player.role = assigned.role;
        player.motivation = assigned.motivation;
      }
    }

    // Generate audio narration
    const audioUrl = await generateNarration(episodeData.narratorIntro);
    game.narratorAudioUrl = audioUrl;

    game.status = GAME_STATUS.INTRO;
    io.to(episodeId).emit('game_state', game);

    // Send each player their private role card
    for (const player of game.players) {
      io.to(player.id).emit('role_assigned', {
        role: player.role,
        motivation: player.motivation,
      });
    }

    // Auto-advance from intro to first phase after 8 seconds
    setTimeout(() => beginPhase(episodeId, io), 8000);
  } catch (err) {
    console.error('[Game] Failed to start episode:', err);
    game.status = GAME_STATUS.LOBBY;
    io.to(episodeId).emit('game_state', game);
    io.to(episodeId).emit('error', 'Failed to generate episode. Try again.');
  }
};

export const beginPhase = (episodeId, io) => {
  const game = games.get(episodeId);
  if (!game) return;

  game.phase += 1;
  game.votes = {};
  game.actions = {};
  game.status = GAME_STATUS.PHASE_ACTION;
  io.to(episodeId).emit('game_state', game);

  // Bot players auto-submit random actions after 2 seconds
  const bots = game.players.filter(p => p.isBot && !p.isEliminated);
  setTimeout(() => {
    for (const bot of bots) {
      const choiceIdx = Math.floor(Math.random() * game.currentChoices.length);
      submitAction(episodeId, bot.id, choiceIdx, io);
    }
  }, 2000);

  // Auto-advance to voting after 45 seconds if not all submitted
  setTimeout(() => {
    if (game.status === GAME_STATUS.PHASE_ACTION) {
      beginVoting(episodeId, io);
    }
  }, 45000);
};

export const submitAction = (episodeId, playerId, choiceIndex, io) => {
  const game = games.get(episodeId);
  if (!game || game.status !== GAME_STATUS.PHASE_ACTION) return;

  game.actions[playerId] = choiceIndex;

  const activePlayers = game.players.filter(p => !p.isEliminated);
  const allActed = activePlayers.every(p => game.actions[p.id] !== undefined);

  io.to(episodeId).emit('action_submitted', { playerId, total: Object.keys(game.actions).length, needed: activePlayers.length });

  if (allActed) beginVoting(episodeId, io);
};

export const beginVoting = (episodeId, io) => {
  const game = games.get(episodeId);
  if (!game) return;

  game.status = GAME_STATUS.PHASE_VOTE;
  io.to(episodeId).emit('game_state', game);

  // Bots vote randomly after 1.5 seconds
  const bots = game.players.filter(p => p.isBot && !p.isEliminated);
  setTimeout(() => {
    for (const bot of bots) {
      const others = game.players.filter(p => p.id !== bot.id && !p.isEliminated);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        castVote(episodeId, bot.id, target.id, io);
      }
    }
  }, 1500);

  // Auto-resolve vote after 30 seconds
  setTimeout(() => {
    if (game.status === GAME_STATUS.PHASE_VOTE) {
      resolvePhase(episodeId, io);
    }
  }, 30000);
};

export const castVote = (episodeId, voterId, targetId, io) => {
  const game = games.get(episodeId);
  if (!game || game.status !== GAME_STATUS.PHASE_VOTE) return;

  game.votes[voterId] = targetId;

  const activePlayers = game.players.filter(p => !p.isEliminated);
  const allVoted = activePlayers.every(p => game.votes[p.id] !== undefined);

  io.to(episodeId).emit('vote_cast', { voterId, total: Object.keys(game.votes).length, needed: activePlayers.length });

  if (allVoted) resolvePhase(episodeId, io);
};

// The big one: advances the story with Gemini, updates game state
export const resolvePhase = async (episodeId, io) => {
  const game = games.get(episodeId);
  if (!game) return;

  game.status = GAME_STATUS.RESOLVING;
  io.to(episodeId).emit('game_state', game);

  try {
    const playerActions = Object.entries(game.actions).map(([playerId, choiceIdx]) => {
      const player = game.players.find(p => p.id === playerId);
      return {
        playerName: player?.name || playerId,
        choice: game.currentChoices[choiceIdx] || 'did nothing',
      };
    });

    const result = await advancePhase(game, playerActions);

    // Handle elimination
    if (result.eliminatedPlayer) {
      const eliminated = game.players.find(p => p.name === result.eliminatedPlayer);
      if (eliminated) eliminated.isEliminated = true;
    }

    // Store phase history
    game.phaseHistory.push({
      phase: game.phase,
      plotReveal: result.plotReveal,
      actions: { ...game.actions },
      votes: { ...game.votes },
      eliminated: result.eliminatedPlayer || null,
    });

    game.currentPlotReveal = result.plotReveal;
    game.currentChoices = result.nextChoices || [];

    // Generate narration audio for the phase reveal
    const audioUrl = await generateNarration(result.plotReveal);
    game.currentAudioUrl = audioUrl;

    if (result.episodeResolved || game.phase >= game.maxPhases) {
      game.status = GAME_STATUS.RESOLVED;
      game.winner = result.winner;
      game.currentPlotReveal = result.resolution || result.plotReveal;

      // Find winner's wallet and send reward
      const winnerPlayer = game.players.find(p => p.name === result.winner);
      if (winnerPlayer?.walletAddress) {
        game.winnerWalletAddress = winnerPlayer.walletAddress;
        const reward = await sendWinnerReward(winnerPlayer.walletAddress);
        if (reward.success) game.rewardTxSignature = reward.signature;
      }
    } else {
      game.status = GAME_STATUS.PHASE_ACTION;
      // Begin next phase after 10 seconds (time for players to read the reveal)
      setTimeout(() => beginPhase(episodeId, io), 10000);
    }

    io.to(episodeId).emit('game_state', game);
  } catch (err) {
    console.error('[Game] Phase resolution failed:', err);
    game.status = GAME_STATUS.PHASE_ACTION;
    io.to(episodeId).emit('game_state', game);
    io.to(episodeId).emit('error', 'Story generation failed. Continuing game...');
  }
};
