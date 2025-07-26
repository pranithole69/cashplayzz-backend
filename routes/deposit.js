router.post("/", verifyToken, async (req, res) => {
  try {
    const { amount, transactionId, senderName } = req.body;

    if (!amount || !transactionId || !senderName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newDeposit = new Deposit({
      user: req.user.id,
      amount,
      transactionId,
      senderName,
    });

    await newDeposit.save();

    // 👇 Populate user info (like username)
    const populatedDeposit = await newDeposit.populate("user", "username");

    res.status(201).json({
      message: "Deposit request submitted",
      deposit: populatedDeposit,
    });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
