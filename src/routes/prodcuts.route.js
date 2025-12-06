const express = require("express");
const verifyAuthToken = require("../middlewares/auth");

const productsRoute = ({ productsCollection, ObjectId }) => {
  const router = express.Router();

  router.post("/", verifyAuthToken, async (req, res) => {
    try {
      const product = req.body;
      await productsCollection.insertOne(product);
      res.status(201).send({ message: "Product Added Successfully!" });
    } catch {
      res
        .status(500)
        .send({ message: "Internal server failed to add a product" });
    }
  });
  router.post("/check-duplicate", verifyAuthToken, async (req, res) => {
    try {
      const { name } = req.body;
      const existedProduct = await productsCollection.findOne({
        name: name,
      });
      if (existedProduct) {
        return res.send({ message: "Product already exists", existed: true });
      } else {
        return res.send({ existed: false });
      }
    } catch {
      res
        .status(500)
        .send({ message: "Internal Server failed to match a product" });
    }
  });
  return router;
};

module.exports = productsRoute;
