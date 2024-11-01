const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { adminAuth } = require("../middleware/auth");

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("name").notEmpty().withMessage("Name is required"),
  ],
  authController.register
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  authController.login
);

router.post(
  "/create-admin",
  [
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("name").notEmpty(),
    body("adminKey").notEmpty(),
  ],
  authController.createAdmin
);

router.put("/promote/:id", adminAuth, authController.promoteToAdmin);

module.exports = router;
