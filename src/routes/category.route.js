const express = require("express");
const verifyAuthToken = require("../middlewares/auth");

const categoryRoute = ({ categoriesCollection, ObjectId }) => {
  const router = express.Router();
  router.get("/", verifyAuthToken, async (_, res) => {
    try {
      const result = await categoriesCollection.find().toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch categories" });
    }
  });
  return router;
};

module.exports = categoryRoute;
