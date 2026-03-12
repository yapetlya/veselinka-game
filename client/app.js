const socket = io();

const roomCodeEl = document.getElementById('roomCode');
const joinUrlEl = document.getElementById('joinUrl');
const playersEl = document.getElementById('players');
const startBtn = document.getElementById('startBtn');
const lobbyPanel = document.getElementById('lobbyPanel');
const roundPanel = document.getElementById('roundPanel');
const resultsPanel = document.getElementById('resultsPanel');
const roundTitleEl = document.getElementById('roundTitle');
const promptEl = document.getElementById('prompt');
const progressEl = document.getElementById('progress');
const resultsEl = document.getElementById('results');

let roomCode = null;

socket.emit('tv:create-room');

startBtn.addEventListener('click', () => {
  if (!roomCode) return;
  socket.emit('tv:start-game', { roomCode });
});

socket.on('tv:room-created', ({ roomCode: code, joinUrl }) => {
  roomCode = code;
  roomCodeEl.textContent = code;
  const absoluteUrl = `${window.location.origin}${joinUrl}`;
  joinUrlEl.textContent = `Join URL: ${absoluteUrl}`;
});

socket.on('room:update', ({ players, state, round }) => {
  playersEl.innerHTML = '';
  players.forEach((player) => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = player.nickname;
    playersEl.appendChild(badge);
  });

  startBtn.disabled = players.length < 1 || state !== 'lobby';

  if (state === 'lobby') {
    lobbyPanel.classList.remove('hidden');
    roundPanel.classList.add('hidden');
    resultsPanel.classList.add('hidden');
  }

  if (state === 'show_results') {
    roundTitleEl.textContent = `Round ${round}`;
  }
});

socket.on('round:started', ({ round, mode, prompt, deadlineMs }) => {
  lobbyPanel.classList.add('hidden');
  roundPanel.classList.remove('hidden');
  resultsPanel.classList.add('hidden');

  roundTitleEl.textContent = `Round ${round} • ${mode.replace('_', ' ')}`;
  promptEl.textContent =
    mode === 'truth_or_dare'
      ? `Truth: ${prompt.truth}  |  Dare: ${prompt.dare}`
      : prompt;
  progressEl.textContent = `Collecting answers... (${Math.floor(deadlineMs / 1000)}s)`;
});

socket.on('round:progress', ({ submitted, totalPlayers }) => {
  progressEl.textContent = `Answers: ${submitted}/${totalPlayers}`;
});

socket.on('round:results', ({ mode, results }) => {
  roundPanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');
  resultsEl.innerHTML = '';

  if (results.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No answers this round.';
    resultsEl.appendChild(li);
    return;
  }

  results.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = mode === 'voting' ? `${item.nickname}: ${item.votes} vote(s)` : `${item.nickname}: ${item.value}`;
    resultsEl.appendChild(li);
  });
});

socket.on('room:closed', ({ message }) => {
  roomCodeEl.textContent = 'CLOSED';
  joinUrlEl.textContent = message;
  startBtn.disabled = true;
});

socket.on('error:message', ({ message }) => {
  progressEl.textContent = message;
});
