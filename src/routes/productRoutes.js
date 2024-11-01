const express = require("express");
const router = express.Router();
const { auth, adminAuth } = require("../middleware/auth");
const productController = require("../controllers/productController");

router.post("/", adminAuth, productController.createProduct);
router.get("/", productController.getProducts);
router.put("/:id", adminAuth, productController.updateProduct);
router.delete("/:id", adminAuth, productController.deleteProduct);

module.exports = router;
