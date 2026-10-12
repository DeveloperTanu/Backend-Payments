const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const paymentRoutes = require("../routes/payment.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Server is online");
});

module.exports = { app };