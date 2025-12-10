const express = require("express");
const verifyAuthToken = require("../middlewares/auth");
const generateTrackingId = require("../utils/generateTrackingId");
const attachAdminFlag = require("../middlewares/attachAdminFlag");
const attachManagerFlag = require("../middlewares/attachManagerFlag");
const logTracking = require("../utils/orderLogTracking");

const ordersRoute = ({ ordersCollection, trackingCollection, ObjectId }) => {
  const router = express.Router();

  // add a new order
  router.post("/", verifyAuthToken, async (req, res) => {
    try {
      const bookingInfo = req.body;
      const trackingId = generateTrackingId();
      const existedBooking = await ordersCollection.findOne({
        productName: bookingInfo.productName,
        productId: bookingInfo.productId,
        buyerEmail: bookingInfo.buyerEmail,
        deliveryStatus: { $in: ["not_started", "pending"] },
      });
      if (existedBooking)
        return res.status(400).send({
          message:
            "Already booked! You can book again after manager confirm previous order.",
        });
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
        bookingInfo.paymentMethod === "cod" ? "pending" : "not_started",
        "Waiting for approval"
      );
      res.status(201).send(finalResult);
    } catch {
      res.status(500).send({ message: "Server failed to update product" });
    }
  });

  // get all orders with queries
  router.get("/", verifyAuthToken, attachAdminFlag, async (req, res) => {
    try {
      const { email, search, status, payment } = req.query;
      const query = {};
      if (email) {
        query.buyerEmail = email;
      }
      if (payment) {
        query.paymentStatus = payment;
      }
      if (status) {
        query.deliveryStatus = status;
      }
      if (search) {
        query.productName = { $regex: search, $options: "i" };
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

  // get current delivery statuses
  router.get("/statuses", verifyAuthToken, attachAdminFlag, async (_, res) => {
    try {
      const result = await ordersCollection
        .find()
        .project({ deliveryStatus: 1 })
        .toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Failed to fetch statuses" });
    }
  });

  // get pending orders
  router.get(
    "/pending",
    verifyAuthToken,
    attachManagerFlag,
    async (req, res) => {
      try {
        const { email, search } = req.query;
        const query = {};
        if (email) {
          query.managerEmail = email;
        }
        if (search) {
          query.productName = { $regex: search, $options: "i" };
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

  // get approved orders
  router.get(
    "/approved",
    verifyAuthToken,
    attachManagerFlag,
    async (req, res) => {
      try {
        const { email, search } = req.query;
        const query = {};
        if (email) {
          query.managerEmail = email;
        }
        if (search) {
          query.productName = { $regex: search, $options: "i" };
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

  // get a single order
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

  // update delivery status
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
      if (deliveryStatus === "approved") {
        logTracking(
          req,
          id,
          trackingId,
          deliveryStatus,
          "Order Approved, delivery process started"
        );
        updateDoc.$set.approvedAt = new Date();
      } else {
        logTracking(req, id, trackingId, deliveryStatus, details);
      }
      const result = await ordersCollection.updateOne(query, updateDoc);
      res.send(result);
    } catch {
      res
        .status(500)
        .send({ message: "server failed to update delivery status" });
    }
  });

  // delete an order and related tracking logs
  router.delete("/:id", verifyAuthToken, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("id", id, typeof id);
      const query = { _id: new ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      if (
        order.deliveryStatus !== "pending" &&
        order.deliveryStatus !== "not_started"
      ) {
        return res.status(400).send({ message: "This order can't be deleted" });
      }
      const result = await ordersCollection.deleteOne(query);
      const deleteResult = await trackingCollection.deleteMany({ orderId: id });
      return res.send({ result, deleteResult });
    } catch {
      res.status(500).send({ message: "Server failed to cancel your order" });
    }
  });
  return router;
};

module.exports = ordersRoute;
