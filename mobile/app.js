const socket = io();

const params = new URLSearchParams(window.location.search);

const joinPanel = document.getElementById('joinPanel');
const gamePanel = document.getElementById('gamePanel');
const roomInput = document.getElementById('roomInput');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const joinError = document.getElementById('joinError');
const statusEl = document.getElementById('status');
const categoryEl = document.getElementById('category');
const questionEl = document.getElementById('question');
const timerEl = document.getElementById('timer');
const answersEl = document.getElementById('answers');
const resultEl = document.getElementById('result');
const answerButtons = Array.from(document.querySelectorAll('.answer-btn'));

let roomCode = (params.get('room') || '').toUpperCase();
let timerInterval = null;

if (roomCode) roomInput.value = roomCode;

function startTimer(seconds) {
  clearInterval(timerInterval);
  let left = seconds;
  timerEl.textContent = `Осталось: ${left} сек`;
  timerInterval = setInterval(() => {
    left -= 1;
    timerEl.textContent = `Осталось: ${Math.max(0, left)} сек`;
    if (left <= 0) clearInterval(timerInterval);
  }, 1000);
}

joinBtn.addEventListener('click', () => {
  roomCode = roomInput.value.trim().toUpperCase();
  const nickname = nameInput.value.trim();

  if (!roomCode || !nickname) {
    joinError.textContent = 'Введите код комнаты и ник.';
    return;
  }

  socket.emit('mobile:join-room', { roomCode, nickname });
});

answerButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const answerIndex = Number(button.dataset.index);
    socket.emit('answer', { roomCode, answerIndex });
    resultEl.textContent = `Ответ ${button.textContent} отправлен ✅`;
    answerButtons.forEach((btn) => {
      btn.disabled = true;
    });
  });
});

socket.on('join:error', ({ message }) => {
  joinError.textContent = message;
});

socket.on('join:success', ({ roomCode: joinedCode, player }) => {
  roomCode = joinedCode;
  joinPanel.classList.add('hidden');
  gamePanel.classList.remove('hidden');
  statusEl.textContent = `Комната ${roomCode}, игрок: ${player.nickname}`;
  questionEl.textContent = 'Ждём выбор категории на ТВ...';
  joinError.textContent = '';
});

socket.on('new-question', ({ category, question, options, timer }) => {
  categoryEl.textContent = `Категория: ${category}`;
  questionEl.textContent = question;
  resultEl.textContent = '';
  answersEl.classList.remove('hidden');

  answerButtons.forEach((btn, idx) => {
    btn.disabled = false;
    btn.textContent = `${String.fromCharCode(65 + idx)}: ${options[idx]}`;
  });

  startTimer(timer || 20);
});

socket.on('show-result', ({ correctIndex, scores }) => {
  clearInterval(timerInterval);
  timerEl.textContent = 'Раунд завершён';
  resultEl.textContent = `Правильный ответ: ${String.fromCharCode(65 + correctIndex)}`;

  const myScore = scores[socket.id];
  if (typeof myScore === 'number') {
    resultEl.textContent += ` | Ваш счёт: ${myScore}`;
  }

  answerButtons.forEach((btn) => {
    btn.disabled = true;
  });
});

socket.on('room:closed', ({ message }) => {
  questionEl.textContent = message;
  answerButtons.forEach((btn) => {
    btn.disabled = true;
  });
});
