const { createCheckoutSession } = require("../services/stripe.service");

const createCheckout = async (req, res) => {
  try {
    const session = await createCheckoutSession(req.user);

    res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error.message);

    res.status(500).json({
      message:
        "something went wrong with the payment or it was cancelled - Don't worry, you have not bee any amount hasn't been deducted from your balance",
    });
  }
};

module.exports = { createCheckout };
