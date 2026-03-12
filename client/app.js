const socket = io();

const roomCodeEl = document.getElementById('roomCode');
const joinUrlEl = document.getElementById('joinUrl');
const playersEl = document.getElementById('players');
const categoryPanel = document.getElementById('categoryPanel');
const questionPanel = document.getElementById('questionPanel');
const categoryTitle = document.getElementById('categoryTitle');
const questionText = document.getElementById('questionText');
const optionsList = document.getElementById('optionsList');
const timerEl = document.getElementById('timer');
const resultEl = document.getElementById('result');
const categoryButtons = Array.from(document.querySelectorAll('.category-btn'));

let roomCode = null;
let timerInterval = null;

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

socket.emit('tv:create-room');

categoryButtons.forEach((button) => {
  button.setAttribute('tabindex', '0');
  button.addEventListener('click', () => {
    if (!roomCode) return;
    const category = button.dataset.category;
    socket.emit('select-category', { roomCode, category });
  });
});

document.addEventListener('keydown', (event) => {
  const currentIndex = categoryButtons.findIndex((btn) => btn === document.activeElement);
  if (currentIndex === -1) return;

  const cols = 3;
  let next = currentIndex;

  if (event.key === 'ArrowRight') next = Math.min(categoryButtons.length - 1, currentIndex + 1);
  if (event.key === 'ArrowLeft') next = Math.max(0, currentIndex - 1);
  if (event.key === 'ArrowDown') next = Math.min(categoryButtons.length - 1, currentIndex + cols);
  if (event.key === 'ArrowUp') next = Math.max(0, currentIndex - cols);

  if (next !== currentIndex) {
    event.preventDefault();
    categoryButtons[next].focus();
  }
});

socket.on('tv:room-created', ({ roomCode: code, joinUrl }) => {
  roomCode = code;
  roomCodeEl.textContent = code;
  joinUrlEl.textContent = `Ссылка: ${window.location.origin}${joinUrl}`;
  if (categoryButtons[0]) categoryButtons[0].focus();
});

socket.on('room:update', ({ players }) => {
  playersEl.innerHTML = '';
  players.forEach((player) => {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = player.nickname;
    playersEl.appendChild(badge);
  });
});

socket.on('new-question', ({ category, question, options, timer }) => {
  resultEl.textContent = '';
  categoryTitle.textContent = `Категория: ${category}`;
  questionText.textContent = question;

  optionsList.innerHTML = '';
  options.forEach((option, index) => {
    const li = document.createElement('li');
    li.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    optionsList.appendChild(li);
  });

  categoryPanel.classList.add('hidden');
  questionPanel.classList.remove('hidden');
  startTimer(timer || 20);
});

socket.on('show-result', ({ correctIndex, scores }) => {
  clearInterval(timerInterval);
  timerEl.textContent = 'Время вышло!';
  resultEl.textContent = `Правильный ответ: ${String.fromCharCode(65 + correctIndex)}. Выберите следующую категорию.`;

  const scoreText = Object.entries(scores)
    .map(([id, score]) => `${id.slice(0, 4)}…: ${score}`)
    .join(' | ');
  if (scoreText) {
    resultEl.textContent += ` Счёт: ${scoreText}`;
  }

  categoryPanel.classList.remove('hidden');
});

socket.on('error:message', ({ message }) => {
  resultEl.textContent = message;
});

socket.on('room:closed', ({ message }) => {
  resultEl.textContent = message;
});
