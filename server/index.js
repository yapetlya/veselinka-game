const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 8;
const QUESTION_TIMER_SEC = 20;

const categories = {
  'Кино': [
    { question: 'В каком фильме герой чаще всего молчит, но именно его реплики разобрали на цитаты?', options: ['Драйв', 'Безумный Макс: Дорога ярости', 'Джон Уик', 'Малыш на драйве'], correct: 0 },
    { question: 'Какой фильм НЕ снят Кристофером Ноланом, хотя многие уверены в обратном?', options: ['Престиж', 'Помни', 'Остров проклятых', 'Дюнкерк'], correct: 2 },
    { question: 'Где впервые прозвучала фраза, которую путают с “Люк, я твой отец”?', options: ['Звёздные войны: Новая надежда', 'Империя наносит ответный удар', 'Возвращение джедая', 'Скрытая угроза'], correct: 1 },
    { question: 'Какой оскароносный фильм выиграл “Лучший фильм”, но режиссёр за него не получил “Лучшего режиссёра”?', options: ['Арго', 'Титаник', 'Форма воды', 'Паразиты'], correct: 0 },
    { question: 'Какой фильм формально считается первым полнометражным цветным мультфильмом Disney?', options: ['Пиноккио', 'Белоснежка и семь гномов', 'Фантазия', 'Дамбо'], correct: 1 },
    { question: 'В каком фильме главный злодей появляется на экране меньше 20 минут, но его знают все?', options: ['Молчание ягнят', 'Семь', 'Психо', 'Челюсти'], correct: 0 },
    { question: 'Какой фильм снят одним дублем… но на самом деле это хитрый монтаж?', options: ['1917', 'Бёрдмэн', 'Ревенант', 'Гравитация'], correct: 1 },
    { question: 'Какой режиссёр снял “Чужого”, “Гладиатора” и “Марсианина”?', options: ['Джеймс Кэмерон', 'Ридли Скотт', 'Питер Джексон', 'Дэвид Финчер'], correct: 1 },
    { question: 'В каком фильме герой возвращается домой, а дома у него уже другая жизнь?', options: ['Остров проклятых', 'Начало', 'Пленницы', 'Идентификация Борна'], correct: 3 },
    { question: 'Какой фильм стал первым, собравшим более 2 млрд долларов в мировом прокате?', options: ['Аватар', 'Титаник', 'Мстители: Финал', 'Звёздные войны: Пробуждение силы'], correct: 0 },
    { question: 'Какой актёр НЕ играл Джокера в полнометражном кино?', options: ['Хоакин Феникс', 'Джаред Лето', 'Уиллем Дефо', 'Хит Леджер'], correct: 2 },
    { question: 'В каком фильме саундтрек написал Ханс Циммер, но многие думают на Джона Уильямса?', options: ['Интерстеллар', 'Гарри Поттер и философский камень', 'Индиана Джонс', 'Список Шиндлера'], correct: 0 }
  ],
  'Игры': [
    { question: 'Какая игра НЕ выходила на первой PlayStation, хотя её часто там “помнят”?', options: ['Crash Team Racing', 'The Last of Us', 'Tekken 3', 'Metal Gear Solid'], correct: 1 },
    { question: 'В какой игре фраза “The cake is a lie” стала мемом?', options: ['Portal', 'Half-Life 2', 'BioShock', 'Left 4 Dead'], correct: 0 },
    { question: 'Какой персонаж появился раньше остальных?', options: ['Соник', 'Марио', 'Лара Крофт', 'Мастер Чиф'], correct: 1 },
    { question: 'Какая студия создала серию Dark Souls?', options: ['Capcom', 'FromSoftware', 'Konami', 'PlatinumGames'], correct: 1 },
    { question: 'Какой жанр у первой GTA (1997) на самом деле?', options: ['Третье лицо open-world', 'Изометрический экшен с видом сверху', 'Гонки', 'Пошаговая стратегия'], correct: 1 },
    { question: 'Какая игра первой получила официальный киберспортивный миллионный призовой на The International?', options: ['Dota 2', 'StarCraft II', 'CS:GO', 'League of Legends'], correct: 0 },
    { question: 'В какой игре можно пройти финал, никого не убив?', options: ['DOOM (2016)', 'Dishonored', 'Call of Duty 4', 'Resident Evil 4'], correct: 1 },
    { question: 'Какая игра НЕ от Valve?', options: ['Team Fortress 2', 'Left 4 Dead', 'Apex Legends', 'Portal 2'], correct: 2 },
    { question: 'Что из этого было эксклюзивом Nintendo дольше всего?', options: ['Bayonetta 2', 'Minecraft', 'Hades', 'Cuphead'], correct: 0 },
    { question: 'В каком году вышла Minecraft в релиз 1.0?', options: ['2009', '2011', '2013', '2010'], correct: 1 },
    { question: 'Какую игру называют “симулятором ходьбы”, хотя там важнее история, чем механики?', options: ['Firewatch', 'Quake', 'Diablo II', 'Tekken 7'], correct: 0 },
    { question: 'Какая серия известна режимом “New Game+” задолго до моды на него?', options: ['Chrono Trigger', 'FIFA', 'Need for Speed', 'The Sims'], correct: 0 }
  ],
  'Мультфильмы': [
    { question: 'Кто из этих персонажей Disney формально НЕ принцесса?', options: ['Мулан', 'Анна', 'Моана', 'Эльза'], correct: 3 },
    { question: 'В каком мультфильме Pixar главный герой почти не говорит, но всё понятно?', options: ['Тачки', 'ВАЛЛ-И', 'Вверх', 'Душа'], correct: 1 },
    { question: 'Какой мультсериал начался как пародия, а стал культурным феноменом?', options: ['Гриффины', 'Симпсоны', 'Футурама', 'Рик и Морти'], correct: 1 },
    { question: 'В каком мультфильме звучит песня “Let It Go”?', options: ['Рапунцель', 'Холодное сердце', 'Моана', 'Русалочка'], correct: 1 },
    { question: 'Какой мультфильм студии Ghibli получил “Оскар”?', options: ['Ходячий замок', 'Унесённые призраками', 'Принцесса Мононоке', 'Поньо'], correct: 1 },
    { question: 'Какой герой “Ну, погоди!” чаще инициирует погоню?', options: ['Заяц', 'Волк', 'Оба поровну', 'Почтальон'], correct: 1 },
    { question: 'Какой мультфильм был снят раньше?', options: ['Король Лев', 'Красавица и чудовище', 'Аладдин', 'Покахонтас'], correct: 1 },
    { question: 'Где действие в “Рататуе”?', options: ['Рим', 'Париж', 'Лион', 'Марсель'], correct: 1 },
    { question: 'Какой персонаж из “Шрека” пародирует Пиноккио ложью?', options: ['Осёл', 'Кот в сапогах', 'Печенька', 'Сам Пиноккио'], correct: 3 },
    { question: 'В каком мультфильме главный конфликт строится вокруг эмоций?', options: ['Головоломка', 'Тайна Коко', 'В поисках Немо', 'Храбрая сердцем'], correct: 0 },
    { question: 'Какой сериал от Cartoon Network получил взрослое признание за философию?', options: ['Время приключений', 'Лаборатория Декстера', 'Самурай Джек', 'Скуби-Ду'], correct: 0 },
    { question: 'Какой мультфильм ошибочно считают японским, хотя он французский?', options: ['Таинственные золотые города', 'Твоё имя', 'Акира', 'Унесённые призраками'], correct: 0 }
  ],
  'Техника': [
    { question: 'Что появилось раньше: Bluetooth или Wi‑Fi?', options: ['Wi‑Fi', 'Bluetooth', 'Одновременно', 'NFC'], correct: 1 },
    { question: 'Какой язык старше?', options: ['Python', 'C++', 'Java', 'Go'], correct: 1 },
    { question: 'Какая компания первой выпустила смартфон с ёмкостным мульти-тач в массовый рынок?', options: ['Nokia', 'Apple', 'HTC', 'BlackBerry'], correct: 1 },
    { question: 'Что из этого НЕ браузерный движок?', options: ['Blink', 'Gecko', 'Vulkan', 'WebKit'], correct: 2 },
    { question: 'Какой интерфейс быстрее в типичных бытовых сценариях хранения: SATA SSD или HDD 7200?', options: ['HDD 7200', 'SATA SSD', 'Одинаково', 'Зависит только от кабеля'], correct: 1 },
    { question: 'Кто придумал Всемирную паутину (WWW)?', options: ['Билл Гейтс', 'Тим Бернерс-Ли', 'Стив Джобс', 'Линус Торвальдс'], correct: 1 },
    { question: 'Что означает “404” в вебе?', options: ['Сервер упал', 'Ресурс не найден', 'Нет интернета на клиенте', 'Ошибка базы данных'], correct: 1 },
    { question: 'Какой формат изображения обычно без потерь?', options: ['JPEG', 'PNG', 'MP4', 'GIF с потерями'], correct: 1 },
    { question: 'Какая из этих ОС основана на Linux-ядре?', options: ['iOS', 'Android', 'Windows', 'macOS'], correct: 1 },
    { question: 'Что из этого является протоколом, а не приложением?', options: ['Telegram', 'HTTP', 'Chrome', 'Notion'], correct: 1 },
    { question: 'Какой носитель в среднем быстрее по задержкам: NVMe SSD или SATA SSD?', options: ['SATA SSD', 'NVMe SSD', 'Одинаково', 'DVD'], correct: 1 },
    { question: 'Какой год считается рождением первого iPhone?', options: ['2005', '2007', '2009', '2010'], correct: 1 }
  ],
  'Мир животных': [
    { question: 'Какое животное формально НЕ млекопитающее?', options: ['Дельфин', 'Утконос', 'Акула', 'Кит'], correct: 2 },
    { question: 'Кто из них откладывает яйца, но кормит детёнышей молоком?', options: ['Коала', 'Утконос', 'Пингвин', 'Черепаха'], correct: 1 },
    { question: 'Какое животное может спать стоя и почти не ложиться?', options: ['Лошадь', 'Кролик', 'Лиса', 'Енот'], correct: 0 },
    { question: 'Кто из перечисленных НЕ рыба?', options: ['Скат', 'Дельфин', 'Тунец', 'Сом'], correct: 1 },
    { question: 'У кого самый мощный укус из списка?', options: ['Лев', 'Крокодил', 'Гиена', 'Волк'], correct: 1 },
    { question: 'Какое животное часто “смеётся”, но это не смех?', options: ['Гиена', 'Панда', 'Тигр', 'Олень'], correct: 0 },
    { question: 'Кто из них НЕ насекомое?', options: ['Паук', 'Муравей', 'Пчела', 'Стрекоза'], correct: 0 },
    { question: 'Какое животное видит ультрафиолет лучше человека?', options: ['Пчела', 'Кошка', 'Слон', 'Крот'], correct: 0 },
    { question: 'Кто из этих животных может менять пол в течение жизни?', options: ['Клоун-рыба', 'Белка', 'Ворона', 'Кенгуру'], correct: 0 },
    { question: 'У кого сердце бьётся медленнее в среднем?', options: ['Мышь', 'Слон', 'Колибри', 'Кролик'], correct: 1 },
    { question: 'Какое животное НЕ впадает в настоящую зимнюю спячку?', options: ['Ёж', 'Медведь', 'Летучая мышь', 'Суслик'], correct: 1 },
    { question: 'Кто считается самым крупным животным в истории Земли?', options: ['Африканский слон', 'Синий кит', 'Мегалодон', 'Тираннозавр'], correct: 1 }
  ],
  'Про любовь': [
    { question: 'Что сильнее предсказывает долговечность пары по исследованиям?', options: ['Совпадение музыкальных вкусов', 'Умение решать конфликты', 'Одинаковый знак зодиака', 'Одинаковый рост'], correct: 1 },
    { question: 'Какой фактор чаще разрушает отношения не сразу, а “медленно”?', options: ['Редкие ссоры', 'Презрение', 'Разные хобби', 'Любовь к сериалам'], correct: 1 },
    { question: 'Что из этого — когнитивная ловушка в любви?', options: ['Эффект ореола', 'Закон Ома', 'Теория игр Нэша', 'Синдром самозванца'], correct: 0 },
    { question: 'Правда ли, что “противоположности всегда притягиваются” в долгую?', options: ['Да, почти всегда', 'Нет, чаще важны базовые совпадения', 'Только в браке', 'Только после 30'], correct: 1 },
    { question: 'Что чаще вызывает ревность в стабильных парах?', options: ['Физическая угроза', 'Эмоциональная дистанция', 'Покупка гаджетов', 'Разный режим сна'], correct: 1 },
    { question: 'Какой язык любви чаще всего недооценивают?', options: ['Подарки', 'Качественное время', 'Слова поддержки', 'Помощь делом'], correct: 3 },
    { question: 'Что из этого НЕ является хорошим признаком на старте отношений?', options: ['Быстрые обещания “навсегда”', 'Уважение границ', 'Открытый диалог', 'Последовательность'], correct: 0 },
    { question: 'Что сильнее коррелирует с удовлетворённостью отношениями?', options: ['Частота фото вместе', 'Чувство безопасности', 'Кол-во общих подписок', 'Совпадение любимой еды'], correct: 1 },
    { question: 'Какая стратегия в ссоре чаще работает?', options: ['Молчать до победы', 'Критиковать личность', 'Говорить о чувствах и фактах', 'Сразу уходить'], correct: 2 },
    { question: 'Что из этого — миф о “настоящей любви”?', options: ['Конфликтов быть не должно', 'Нужно договариваться', 'Эмпатия важна', 'Привычки обсуждаются'], correct: 0 },
    { question: 'Какой фактор помогает переживать кризисы в паре?', options: ['Сарказм', 'Общие ценности', 'Скрытность', 'Игра в молчанку'], correct: 1 },
    { question: 'Что чаще всего путают с любовью на раннем этапе?', options: ['Привязанность и идеализацию', 'Доверие', 'Зрелость', 'Партнёрство'], correct: 0 }
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
  throw new Error('Не удалось сгенерировать код комнаты');
}

function emitLobbyUpdate(room) {
  io.to(room.code).emit('room:update', {
    roomCode: room.code,
    players: Array.from(room.players.values()).map((p) => ({ id: p.id, nickname: p.nickname })),
    category: room.currentCategory || null,
    hasActiveQuestion: Boolean(room.currentQuestion)
  });
}

function emitQuestion(room, secondsLeft = QUESTION_TIMER_SEC) {
  if (!room.currentQuestion) return;
  io.to(room.code).emit('new-question', {
    category: room.currentCategory,
    question: room.currentQuestion.question,
    options: room.currentQuestion.options,
    timer: Math.max(1, Math.ceil(secondsLeft))
  });
}

function finishQuestion(room) {
  if (!room || !room.currentQuestion) return;

  clearTimeout(room.questionTimeout);

  for (const [socketId, answerIndex] of room.answers.entries()) {
    if (answerIndex === room.currentQuestion.correct) {
      room.scores.set(socketId, (room.scores.get(socketId) || 0) + 1);
    }
  }

  io.to(room.code).emit('show-result', {
    correctIndex: room.currentQuestion.correct,
    scores: Object.fromEntries(room.scores)
  });

  room.currentQuestion = null;
  room.answers = new Map();
  room.questionTimeout = null;
  room.questionEndsAt = null;
  emitLobbyUpdate(room);
}

io.on('connection', (socket) => {
  socket.on('tv:create-room', () => {
    const roomCode = createUniqueRoomCode();
    const room = {
      code: roomCode,
      tvSocketId: socket.id,
      players: new Map(),
      scores: new Map(),
      currentCategory: null,
      currentQuestion: null,
      answers: new Map(),
      questionTimeout: null,
      questionEndsAt: null
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

  socket.on('mobile:join-room', ({ roomCode, nickname }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('join:error', { message: 'Комната не найдена.' });
      return;
    }

    if (room.players.size >= MAX_PLAYERS) {
      socket.emit('join:error', { message: 'Комната заполнена (макс. 8 игроков).' });
      return;
    }

    const cleanNick = String(nickname || '').trim().slice(0, 24) || `Игрок${Math.floor(Math.random() * 999)}`;
    const player = { id: socket.id, nickname: cleanNick };

    room.players.set(socket.id, player);
    room.scores.set(socket.id, room.scores.get(socket.id) || 0);

    socket.join(code);
    socket.data = { role: 'mobile', roomCode: code };

    socket.emit('join:success', {
      roomCode: code,
      player,
      scores: Object.fromEntries(room.scores)
    });

    emitLobbyUpdate(room);

    if (room.currentQuestion && room.questionEndsAt) {
      const secondsLeft = Math.max(1, (room.questionEndsAt - Date.now()) / 1000);
      emitQuestion(room, secondsLeft);
    }
  });

  socket.on('select-category', ({ roomCode, category }) => {
    const code = (roomCode || socket.data.roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room || room.tvSocketId !== socket.id) {
      socket.emit('error:message', { message: 'Нет доступа к комнате.' });
      return;
    }

    const selectedCategory = String(category || '').trim();
    if (!categories[selectedCategory]) {
      socket.emit('error:message', { message: 'Категория не найдена.' });
      return;
    }

    if (room.questionTimeout) {
      clearTimeout(room.questionTimeout);
    }

    const list = categories[selectedCategory];
    const question = list[Math.floor(Math.random() * list.length)];

    room.currentCategory = selectedCategory;
    room.currentQuestion = question;
    room.answers = new Map();
    room.questionEndsAt = Date.now() + QUESTION_TIMER_SEC * 1000;

    room.questionTimeout = setTimeout(() => finishQuestion(room), QUESTION_TIMER_SEC * 1000);

    emitQuestion(room, QUESTION_TIMER_SEC);
    emitLobbyUpdate(room);
  });

  socket.on('answer', ({ roomCode, answerIndex }) => {
    const code = (roomCode || socket.data.roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room || !room.currentQuestion || !room.players.has(socket.id)) return;
    const index = Number(answerIndex);
    if (!Number.isInteger(index) || index < 0 || index > 3) return;

    room.answers.set(socket.id, index);
  });

  socket.on('disconnect', () => {
    const { role, roomCode } = socket.data || {};
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (role === 'tv') {
      io.to(roomCode).emit('room:closed', { message: 'Экран ТВ отключился. Комната закрыта.' });
      if (room.questionTimeout) clearTimeout(room.questionTimeout);
      rooms.delete(roomCode);
      return;
    }

    if (role === 'mobile') {
      room.players.delete(socket.id);
      room.scores.delete(socket.id);
      room.answers.delete(socket.id);
      emitLobbyUpdate(room);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Veselinka server running on http://localhost:${PORT}`);
});
