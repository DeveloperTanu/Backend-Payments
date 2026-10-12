const stripe = require("../config/stripe");

const createCheckoutSession = async (user) => {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "Notes AI Premium",
          },
          unit_amount: 499900,
        },
        quantity: 1,
      },
    ],

    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,

    client_reference_id: user.id,
  });

  return session;
};

module.exports = { createCheckoutSession };