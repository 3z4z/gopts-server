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
  router.get("/", verifyAuthToken, async (req, res) => {
    try {
      const { email } = req.query;
      const query = {};
      if (email) {
        query.managerEmail = email;
      }
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch products" });
    }
  });
  router.get("/:id", verifyAuthToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await productsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    } catch {
      res.status(500).send({ message: "Failed to fetch a product" });
    }
  });
  router.delete("/:id", verifyAuthToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await productsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to delete product" });
    }
  });
  return router;
};

module.exports = productsRoute;
