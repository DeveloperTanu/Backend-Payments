const express = require("express");

const {
  createCheckout,
} = require("../controllers/payment.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/checkout", protect, createCheckout);

module.exports = router;