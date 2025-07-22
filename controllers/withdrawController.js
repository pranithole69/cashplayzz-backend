const Withdraw = require("../models/Withdraw");
const User = require("../models/User");

exports.withdrawRequest = async (req, res) => {
  try {
    const { amount, upiId } = req.body;

    // 1. Validate minimum amount
    if (amount < 10) {
      return res.status(400).json({ message: "Minimum withdrawal is ₹10" });
    }

    // 2. Find user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 3. Check if user has enough balance
    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 4. Check number of withdrawals today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const withdrawsToday = await Withdraw.find({
      userId: req.user.id,
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    if (withdrawsToday.length >= 4) {
      return res.status(429).json({ message: "Max 4 withdrawals per day allowed" });
    }

    // 5. Create withdraw request
    const newWithdraw = new Withdraw({
      userId: req.user.id,
      amount,
      upiId
    });

    // 6. Subtract from balance
    user.balance -= amount;
    user.totalWithdrawals += amount;

    // 7. Save both
    await newWithdraw.save();
    await user.save();

    res.status(201).json({ message: "Withdraw request submitted", newWithdraw });
  } catch (err) {
    console.error("Withdraw Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
