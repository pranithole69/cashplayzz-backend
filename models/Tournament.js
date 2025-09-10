import mongoose from 'mongoose';

const TournamentSchema = new mongoose.Schema({
  teamType: { type: String, required: true },
  gameMode: { type: String, required: true },
  entryFee: { type: Number, required: true },
  maxPlayers: { type: Number, required: true },
  prizePool: { type: Number, required: true },
  roomId: { type: String },
  roomPassword: { type: String },
  matchTime: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.models.Tournament || mongoose.model('Tournament', TournamentSchema);
