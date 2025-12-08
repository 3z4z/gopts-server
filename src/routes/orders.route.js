const express = require("express");
const verifyAuthToken = require("../middlewares/auth");
const generateTrackingId = require("../utils/generateTrackingId");

const ordersRoute = ({ ordersCollection, ObjectId }) => {
  const router = express.Router();
  router.post("/", verifyAuthToken, async (req, res) => {
    try {
      const bookingInfo = req.body;
      const trackingId = generateTrackingId();
      const existedBooking = await ordersCollection.findOne({
        productName: bookingInfo.productName,
        productId: bookingInfo.productId,
        buyerEmail: bookingInfo.buyerEmail,
        paymentStatus: { $in: ["unpaid", "paid"] },
      });
      if (existedBooking)
        return res
          .status(400)
          .send({ message: "You already booked this product" });
      const result = await ordersCollection.insertOne({
        ...bookingInfo,
        trackingId,
        paymentStatus: "unpaid",
        deliveryStatus: "not_started",
        createdAt: new Date(),
      });
      return res.status(201).send({ orderId: result.insertedId, trackingId });
    } catch {
      return res
        .status(500)
        .send({ message: "Server failed to update product" });
    }
  });
  router.get("/", verifyAuthToken, async (req, res) => {
    try {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.buyerEmail = email;
      }
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch your orders" });
    }
  });
  router.get("/:id", verifyAuthToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ordersCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch your order" });
    }
  });
  return router;
};

module.exports = ordersRoute;
