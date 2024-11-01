const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

router.post(
  "/create-payment-intent",
  auth,
  paymentController.createPaymentIntent
);
router.post("/webhook", paymentController.handleWebhook);
router.get("/payment-methods", auth, paymentController.getPaymentMethods);
router.post("/refund/:paymentId", auth, paymentController.createRefund);
router.get("/transactions", auth, paymentController.getTransactionHistory);

module.exports = router;
