# Architecture

Project: veselinka

Party game for Android TV.

Players connect using their phones.

System structure:

TV Screen
- shows QR code
- shows room code
- shows game events
- shows results

Mobile Screen
- join room
- receive personal tasks
- submit answers
- vote

Server
- manages rooms
- manages players
- sends game events
- collects answers

Players per room: 1–8

Technology stack:

Node.js
Socket.io
HTML
CSS
Vanilla JavaScript

Design:
Minimal
Large fonts
Readable on TV

Connection:
Websocket
