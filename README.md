# Veselinka Game (MVP)

Simple party game MVP for Android TV + mobile phones.

## Project structure

- `server/` - Node.js + Express + Socket.io backend
- `client/` - TV screen web client
- `mobile/` - phone controller web client

## Features

- Room system with 4-character room codes
- 1-8 players per room
- TV lobby + round + results screens
- Mobile join + answer/vote flow
- Basic game loop with automatic next rounds
- Modes: questions, truth or dare, voting, speed

## Run

```bash
npm install
npm start
```

Open:

- TV: `http://localhost:3000/client/`
- Mobile: `http://localhost:3000/mobile/`
