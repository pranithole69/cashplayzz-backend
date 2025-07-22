const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  upiId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "pending", // can be 'pending', 'approved', 'rejected'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Withdraw", withdrawSchema);
