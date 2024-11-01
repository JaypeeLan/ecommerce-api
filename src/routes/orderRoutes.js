const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middleware/auth");
const orderController = require("../controllers/orderController");

router.post("/", auth, orderController.createOrder);
router.get("/", auth, orderController.getOrders);
router.get("/:id", auth, orderController.getOrderById);
router.put("/:id/status", adminAuth, orderController.updateOrderStatus);

module.exports = router;
