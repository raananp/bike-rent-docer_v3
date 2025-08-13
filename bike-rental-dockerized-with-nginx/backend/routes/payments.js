const express = require('express');
const router = express.Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const IS_DEV = STRIPE_SECRET_KEY.includes('FAKE_KEY');

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'thb' } = req.body;

    if (IS_DEV) {
      // Fake response for UI testing without Stripe
      return res.json({ clientSecret: 'test_client_secret_123' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment init failed' });
  }
});

module.exports = router;