const socket = io();

const params = new URLSearchParams(window.location.search);

const joinPanel = document.getElementById('joinPanel');
const gamePanel = document.getElementById('gamePanel');
const roomInput = document.getElementById('roomInput');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const joinError = document.getElementById('joinError');
const statusEl = document.getElementById('status');
const modeEl = document.getElementById('mode');
const taskEl = document.getElementById('task');
const answerInput = document.getElementById('answerInput');
const sendBtn = document.getElementById('sendBtn');
const sentState = document.getElementById('sentState');

let roomCode = (params.get('room') || '').toUpperCase();
if (roomCode) roomInput.value = roomCode;

joinBtn.addEventListener('click', () => {
  roomCode = roomInput.value.trim().toUpperCase();
  const nickname = nameInput.value.trim();

  if (!roomCode || !nickname) {
    joinError.textContent = 'Enter room code and nickname.';
    return;
  }

  socket.emit('mobile:join-room', { roomCode, nickname });
});

sendBtn.addEventListener('click', () => {
  const value = answerInput.value.trim();
  if (!value || !roomCode) return;

  socket.emit('mobile:submit-answer', { roomCode, value });
  answerInput.value = '';
  sentState.textContent = 'Answer sent ✅';
  sendBtn.disabled = true;
});

socket.on('join:error', ({ message }) => {
  joinError.textContent = message;
});

socket.on('join:success', ({ roomCode: joinedCode, player, state, currentMode }) => {
  roomCode = joinedCode;
  joinPanel.classList.add('hidden');
  gamePanel.classList.remove('hidden');
  statusEl.textContent = `Joined ${roomCode} as ${player.nickname}`;
  modeEl.textContent = state === 'lobby' ? 'Waiting for game start...' : `Current mode: ${currentMode || ''}`;
  joinError.textContent = '';
});

socket.on('round:started', ({ mode, prompt }) => {
  modeEl.textContent = `Mode: ${mode.replace('_', ' ')}`;
  taskEl.textContent = mode === 'truth_or_dare' ? `Truth: ${prompt.truth}\nDare: ${prompt.dare}` : prompt;
  sentState.textContent = '';
  sendBtn.disabled = false;
  answerInput.placeholder = mode === 'voting' ? 'Vote by typing a nickname' : 'Type your answer';
});

socket.on('round:results', ({ mode }) => {
  sentState.textContent = mode === 'voting' ? 'Votes counted. Next round soon...' : 'Round finished. Next round soon...';
  sendBtn.disabled = true;
});

socket.on('room:update', ({ state }) => {
  if (state === 'lobby') {
    modeEl.textContent = 'Waiting for game start...';
    taskEl.textContent = '';
  }
});

socket.on('room:closed', ({ message }) => {
  modeEl.textContent = 'Room closed';
  taskEl.textContent = message;
  sendBtn.disabled = true;
});
