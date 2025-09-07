// src/models/Tournament.js

const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  teamType: { type: String, required: true },
  entryFee: { type: Number, required: true },
  prizePool: { type: Number, required: true },
  matchTime: { type: Date, required: true },
  players: { type: Number, default: 0 },
  maxPlayers: { type: Number, required: true },
  roomId: { type: String },
  roomPassword: { type: String },
  rules: [{ type: String }],
});

module.exports = mongoose.model('Tournament', TournamentSchema);
