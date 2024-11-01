const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Payment = require("../models/Payment");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        customerId: req.user._id.toString(),
      },
    });

    // Save payment record
    const payment = new Payment({
      order: order._id,
      customer: req.user._id,
      amount: order.totalAmount,
      paymentIntentId: paymentIntent.id,
      status: "pending",
    });
    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: req.user.stripeCustomerId,
      type: "card",
    });

    res.json(paymentMethods.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || "requested_by_customer",
    });

    // Update payment record
    payment.refunds.push({
      refundId: refund.id,
      amount: amount || payment.amount,
      reason,
      status: refund.status,
    });
    await payment.save();

    res.json(refund);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Payment.find({ customer: req.user._id })
      .populate("order")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  if (payment) {
    payment.status = "completed";
    payment.processedAt = new Date();
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = "completed";
      order.status = "processing";
      await order.save();
    }
  }
}

async function handlePaymentFailure(paymentIntent) {
  const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
  if (payment) {
    payment.status = "failed";
    payment.failureReason = paymentIntent.last_payment_error?.message;
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
    }
  }
}
