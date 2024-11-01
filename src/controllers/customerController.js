const User = require("../models/User");
const Order = require("../models/Order");
const { validationResult } = require("express-validator");

exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order || "desc";
    const search = req.query.search || "";

    const query = {
      role: "customer",
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const customers = await User.find(query)
      .select("-password")
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCustomers: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    // Check if the requesting user is an admin or the customer themselves
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const customer = await User.findById(req.params.id).select("-password");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Get customer's orders
    const orders = await Order.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(5); // Get last 5 orders

    // Get customer statistics
    const stats = await Order.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    res.json({
      customer,
      statistics: stats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      },
      recentOrders: orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    // Check if the requesting user is an admin or the customer themselves
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Fields that can be updated
    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    // If email is being updated, check if it's already in use
    if (allowedUpdates.email) {
      const existingUser = await User.findOne({
        email: allowedUpdates.email,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const customer = await User.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Check for existing orders
    const hasOrders = await Order.exists({ customer: customer._id });

    if (hasOrders) {
      // Soft delete - mark customer as inactive
      customer.status = "inactive";
      customer.deactivatedAt = new Date();
      await customer.save();

      return res.json({
        message: "Customer deactivated successfully",
        note: "Customer has existing orders and was soft-deleted",
      });
    }

    // Hard delete if no orders exist
    await customer.deleteOne();

    res.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerOrders = async (req, res) => {
  try {
    // Check if the requesting user is an admin or the customer themselves
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = { customer: req.params.id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("items.product", "name price");

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
