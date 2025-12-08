const express = require("express");
const verifyAuthToken = require("../middlewares/auth");
const generateTrackingId = require("../utils/generateTrackingId");
const attachAdminFlag = require("../middlewares/attachAdminFlag");
const attachManagerFlag = require("../middlewares/attachManagerFlag");
const logTracking = require("../utils/orderLogTracking");

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
        paymentStatus: bookingInfo.paymentMethod === "cod" ? "cod" : "unpaid",
        deliveryStatus:
          bookingInfo.paymentMethod === "cod" ? "pending" : "not_started",
        createdAt: new Date(),
      });
      const finalResult = { orderId: result.insertedId, trackingId };
      logTracking(
        req,
        finalResult.orderId.toString(),
        finalResult.trackingId,
        "not_started"
      );
      return res.status(201).send(finalResult);
    } catch {
      return res
        .status(500)
        .send({ message: "Server failed to update product" });
    }
  });
  router.get("/", verifyAuthToken, attachAdminFlag, async (req, res) => {
    try {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.buyerEmail = email;
      }
      if (email !== req.auth_email && !req.isAdmin) {
        return res.status(403).send({ message: "Unauthorized" });
      }
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch your orders" });
    }
  });
  router.get(
    "/pending",
    verifyAuthToken,
    attachManagerFlag,
    async (req, res) => {
      try {
        const { email } = req.query;
        const query = {};
        if (email) {
          query.managerEmail = email;
        }

        if (email !== req.auth_email && !req.isManager) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        const result = await ordersCollection
          .find({ ...query, deliveryStatus: "pending" })
          .toArray();
        res.send(result);
      } catch {
        res
          .status(500)
          .send({ message: "Server failed to fetch pending orders" });
      }
    }
  );
  router.get(
    "/approved",
    verifyAuthToken,
    attachManagerFlag,
    async (req, res) => {
      try {
        const { email } = req.query;
        const query = {};
        if (email) {
          query.managerEmail = email;
        }

        if (email !== req.auth_email && !req.isManager) {
          return res.status(403).send({ message: "Forbidden access" });
        }
        const result = await ordersCollection
          .find({
            ...query,
            deliveryStatus: { $nin: ["pending", "not_started", "rejected"] },
          })
          .toArray();
        res.send(result);
      } catch {
        res
          .status(500)
          .send({ message: "Server failed to fetch pending orders" });
      }
    }
  );
  router.get(
    "/:id",
    verifyAuthToken,
    attachAdminFlag,
    attachManagerFlag,
    async (req, res) => {
      try {
        const { id } = req.params;
        const result = await ordersCollection.findOne({
          _id: new ObjectId(id),
        });
        if (
          result.buyerEmail !== req.auth_email &&
          !req.isAdmin &&
          !req.isManager
        ) {
          return res.status(403).send({ message: "Unauthorized" });
        }
        res.send(result);
      } catch {
        res.status(500).send({ message: "Server failed to fetch your order" });
      }
    }
  );
  router.patch("/:id", verifyAuthToken, attachManagerFlag, async (req, res) => {
    try {
      const { id } = req.params;
      const { deliveryStatus, trackingId, details } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          deliveryStatus,
        },
      };
      if (deliveryStatus === "ready") {
        logTracking(
          req,
          id,
          trackingId,
          deliveryStatus,
          "Delivery process started"
        );
        updateDoc.$set.approvedAt = new Date();
      }
      const result = await ordersCollection.updateOne(query, updateDoc);
      logTracking(req, id, trackingId, deliveryStatus, details);
      res.send(result);
    } catch {
      res
        .status(500)
        .send({ message: "server failed to update delivery status" });
    }
  });
  return router;
};

module.exports = ordersRoute;
