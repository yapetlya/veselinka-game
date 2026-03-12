const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 8;
const ROUND_TIMEOUT_MS = 20000;
const RESULTS_TIMEOUT_MS = 7000;

const CONTENT = {
  question: [
    'Who would survive longest on a deserted island?',
    'Who is most likely to accidentally become famous?',
    'What is the best group travel destination?'
  ],
  truth_or_dare: [
    {
      truth: 'What is your most embarrassing story?',
      dare: 'Dance for 10 seconds and send an emoji that matches your vibe.'
    },
    {
      truth: 'What secret talent do you have?',
      dare: 'Speak in a robot voice for the next 20 seconds.'
    }
  ],
  voting: [
    'Who is most likely to forget their own birthday?',
    'Who would be the best game show host?'
  ],
  speed: [
    'Type three words that describe this group!',
    'Type the funniest animal + job combo in 8 words max.'
  ]
};

const rooms = new Map();

app.use('/client', express.static(path.join(__dirname, '..', 'client')));
app.use('/mobile', express.static(path.join(__dirname, '..', 'mobile')));

app.get('/', (_, res) => {
  res.redirect('/client/');
});

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createUniqueRoomCode() {
  let attempts = 0;
  while (attempts < 2000) {
    const code = generateRoomCode();
    if (!rooms.has(code)) return code;
    attempts += 1;
  }
  throw new Error('Unable to generate unique room code');
}

function roomSummary(room) {
  return {
    roomCode: room.code,
    players: Array.from(room.players.values()).map((p) => ({ id: p.id, nickname: p.nickname })),
    state: room.state,
    round: room.round,
    currentMode: room.currentTask?.mode || null
  };
}

function emitLobbyUpdate(room) {
  io.to(room.code).emit('room:update', roomSummary(room));
}

function chooseMode() {
  const modes = ['question', 'truth_or_dare', 'voting', 'speed'];
  return modes[Math.floor(Math.random() * modes.length)];
}

function choosePrompt(mode) {
  if (mode === 'truth_or_dare') {
    return CONTENT.truth_or_dare[Math.floor(Math.random() * CONTENT.truth_or_dare.length)];
  }
  const list = CONTENT[mode];
  return list[Math.floor(Math.random() * list.length)];
}

function startRound(room) {
  if (room.players.size === 0) {
    room.state = 'lobby';
    emitLobbyUpdate(room);
    return;
  }

  room.round += 1;
  room.state = 'round_active';
  const mode = chooseMode();
  const prompt = choosePrompt(mode);

  room.currentTask = {
    mode,
    prompt,
    answers: new Map(),
    timeout: null,
    revealTimeout: null
  };

  io.to(room.code).emit('round:started', {
    round: room.round,
    mode,
    prompt,
    deadlineMs: ROUND_TIMEOUT_MS
  });

  room.currentTask.timeout = setTimeout(() => finalizeRound(room), ROUND_TIMEOUT_MS);
  emitLobbyUpdate(room);
}

function getVotingResults(room) {
  const tally = new Map();
  for (const player of room.players.values()) {
    tally.set(player.id, { playerId: player.id, nickname: player.nickname, votes: 0 });
  }

  for (const answer of room.currentTask.answers.values()) {
    if (!tally.has(answer.value)) continue;
    tally.get(answer.value).votes += 1;
  }

  return Array.from(tally.values()).sort((a, b) => b.votes - a.votes);
}

function finalizeRound(room) {
  if (!room.currentTask || room.state !== 'round_active') return;

  clearTimeout(room.currentTask.timeout);
  const { mode, prompt, answers } = room.currentTask;

  const results =
    mode === 'voting'
      ? getVotingResults(room)
      : Array.from(answers.values()).map((item) => ({
          playerId: item.playerId,
          nickname: item.nickname,
          value: item.value
        }));

  room.state = 'show_results';
  io.to(room.code).emit('round:results', {
    round: room.round,
    mode,
    prompt,
    results,
    submitted: answers.size,
    totalPlayers: room.players.size
  });

  room.currentTask.revealTimeout = setTimeout(() => startRound(room), RESULTS_TIMEOUT_MS);
  emitLobbyUpdate(room);
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (!room) return;

  if (room.currentTask?.timeout) clearTimeout(room.currentTask.timeout);
  if (room.currentTask?.revealTimeout) clearTimeout(room.currentTask.revealTimeout);

  rooms.delete(code);
}

io.on('connection', (socket) => {
  socket.on('tv:create-room', () => {
    const roomCode = createUniqueRoomCode();
    const room = {
      code: roomCode,
      tvSocketId: socket.id,
      players: new Map(),
      state: 'lobby',
      round: 0,
      currentTask: null
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data = { role: 'tv', roomCode };

    socket.emit('tv:room-created', {
      roomCode,
      joinUrl: `/mobile/?room=${roomCode}`
    });

    emitLobbyUpdate(room);
  });

  socket.on('tv:start-game', ({ roomCode }) => {
    const room = rooms.get((roomCode || '').toUpperCase());
    if (!room || room.tvSocketId !== socket.id) {
      socket.emit('error:message', { message: 'Room not found or unauthorized.' });
      return;
    }

    if (room.state === 'round_active' || room.state === 'show_results') return;
    startRound(room);
  });

  socket.on('mobile:join-room', ({ roomCode, nickname }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('join:error', { message: 'Room not found.' });
      return;
    }

    if (room.players.size >= MAX_PLAYERS) {
      socket.emit('join:error', { message: 'Room is full (8 players max).' });
      return;
    }

    const cleanNick = String(nickname || '').trim().slice(0, 24) || `Player${Math.floor(Math.random() * 999)}`;
    const player = { id: socket.id, nickname: cleanNick };

    room.players.set(socket.id, player);
    socket.join(code);
    socket.data = { role: 'mobile', roomCode: code };

    socket.emit('join:success', {
      roomCode: code,
      player,
      state: room.state,
      round: room.round,
      currentMode: room.currentTask?.mode || null
    });

    emitLobbyUpdate(room);

    if (room.currentTask && room.state === 'round_active') {
      socket.emit('round:started', {
        round: room.round,
        mode: room.currentTask.mode,
        prompt: room.currentTask.prompt,
        deadlineMs: ROUND_TIMEOUT_MS
      });
    }
  });

  socket.on('mobile:submit-answer', ({ roomCode, value }) => {
    const code = (roomCode || socket.data.roomCode || '').toUpperCase();
    const room = rooms.get(code);

    if (!room || room.state !== 'round_active' || !room.currentTask) return;
    if (!room.players.has(socket.id)) return;

    const player = room.players.get(socket.id);
    const trimmed = String(value || '').trim();
    if (!trimmed) return;

    let submittedValue = trimmed.slice(0, 180);
    if (room.currentTask.mode === 'voting') {
      const normalized = submittedValue.toLowerCase();
      const target = Array.from(room.players.values()).find((p) => p.nickname.toLowerCase() === normalized);
      if (target) submittedValue = target.id;
    }

    room.currentTask.answers.set(socket.id, {
      playerId: socket.id,
      nickname: player.nickname,
      value: submittedValue
    });

    io.to(room.tvSocketId).emit('round:progress', {
      submitted: room.currentTask.answers.size,
      totalPlayers: room.players.size
    });

    if (room.currentTask.answers.size >= room.players.size) {
      finalizeRound(room);
    }
  });

  socket.on('disconnect', () => {
    const { role, roomCode } = socket.data || {};
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (role === 'tv') {
      io.to(roomCode).emit('room:closed', { message: 'TV disconnected. Room closed.' });
      cleanupRoom(roomCode);
      return;
    }

    room.players.delete(socket.id);
    room.currentTask?.answers?.delete(socket.id);

    if (room.players.size === 0) {
      room.state = 'lobby';
    }

    emitLobbyUpdate(room);

    if (room.state === 'round_active' && room.currentTask.answers.size >= room.players.size) {
      finalizeRound(room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Veselinka server running on http://localhost:${PORT}`);
});
