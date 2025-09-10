const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 👈 this enables .populate("user")
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
    default: "pending", // pending | approved | rejected
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Withdraw", withdrawSchema);
