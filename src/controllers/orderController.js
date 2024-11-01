const Order = require("../models/Order");
const Product = require("../models/Product");

// Existing createOrder function
exports.createOrder = async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      customer: req.user._id,
    });

    // Update product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      product.stock -= item.quantity;
      await product.save();
    }

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// New getOrders function
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// New getOrderById function
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Existing updateOrderStatus function
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
