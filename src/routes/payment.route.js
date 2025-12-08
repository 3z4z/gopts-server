const express = require("express");
const dotenv = require("dotenv");
const verifyAuthToken = require("../middlewares/auth");
const logTracking = require("../utils/orderLogTracking");
dotenv.config();

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const paymentRoute = ({ paymentsCollection, ordersCollection, ObjectId }) => {
  const router = express.Router();
  router.post("/create-checkout-session", verifyAuthToken, async (req, res) => {
    try {
      const paymentInfo = req.body;
      console.log("paymentInfo", paymentInfo);
      const order = await ordersCollection.findOne({
        _id: new ObjectId(paymentInfo.orderId),
        buyerEmail: req.auth_email,
        paymentStatus: "unpaid",
      });
      if (!order) {
        return res
          .status(400)
          .send({ message: "Payment failed due to no orders" });
      }
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "bdt",
              unit_amount: Number(order?.totalCost) * 100,
              product_data: {
                name: `Confirm payment for ${order?.productName} x${order?.orderQuantity}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId: order?._id.toString(),
          productName: order?.productName,
          trackingId: order?.trackingId,
        },
        customer_email: order?.buyerEmail,
        mode: "payment",
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-failed`,
      });
      return res.send({ url: session.url });
    } catch (err) {
      console.log("Create session error:", err);
      res.status(500).send({ message: "Failed to create session" });
    }
  });
  router.patch("/payment-success", verifyAuthToken, async (req, res) => {
    try {
      const { session_id } = req.query;
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== "paid") {
        return res.status(400).send({
          success: false,
          message: "Payment not completed yet",
        });
      }
      const transactionId = session.payment_intent;
      const existedPayment = await paymentsCollection.findOne({
        $or: [{ transactionId }, { orderId: session.metadata.orderId }],
      });
      console.log(existedPayment);
      if (existedPayment) {
        return res.status(400).send({
          success: false,
          message: `${transactionId} already exists`,
          trackingId: existedPayment.trackingId,
          transactionId: existedPayment.transactionId,
        });
      }
      const query = {
        _id: new ObjectId(session.metadata.orderId),
        paymentStatus: "unpaid",
      };
      const updateOrder = {
        $set: {
          transactionId,
          paymentStatus: "paid",
          deliveryStatus: "pending",
        },
      };
      const result = await ordersCollection.updateOne(query, updateOrder);
      const paymentRecord = {
        amount: session.amount_total / 100,
        currency: session.currency,
        customerEmail: session.customer_email,
        orderId: session.metadata.orderId,
        trackingId: session.metadata.trackingId,
        productName: session.metadata.productName,
        transactionId,
        paymentStatus: session.payment_status,
        paidAt: new Date(),
      };
      if (result.modifiedCount === 0) {
        return res.status(400).send({
          success: false,
          message: "Order already marked as paid",
        });
      }
      const newPayment = await paymentsCollection.insertOne(paymentRecord);
      logTracking(
        req,
        session.metadata.orderId,
        session.metadata.trackingId,
        "payment_completed"
      );
      res.send({
        success: true,
        result,
        paymentInfo: newPayment,
        trackingId: session.metadata.trackingId,
        transactionId,
      });
    } catch (err) {
      console.log("payment error:", err);
      return res.status(500).send({
        success: false,
        message: "Server failed to complete a payment",
        err,
      });
    }
  });
  router.get("/", verifyAuthToken, async (req, res) => {
    try {
      const query = {};
      const { email } = req.query;
      if (email) {
        query.customerEmail = email;
        if (req.auth_email !== email) {
          return res.status(403).send({ message: "forbidden access" });
        }
      }
      const result = await paymentsCollection.find(query).toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch payment info" });
    }
  });

  return router;
};

module.exports = paymentRoute;
