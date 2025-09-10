import mongoose from 'mongoose';

const WithdrawSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentDetails: { type: Object },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNotes: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Withdraw || mongoose.model('Withdraw', WithdrawSchema);
