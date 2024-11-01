const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middleware/auth");
const customerController = require("../controllers/customerController");

router.get("/", adminAuth, customerController.getAllCustomers);
router.get("/:id", auth, customerController.getCustomerById);
router.put("/:id", auth, customerController.updateCustomer);
router.delete("/:id", adminAuth, customerController.deleteCustomer);

module.exports = router;
