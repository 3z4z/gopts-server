const express = require("express");
const verifyAuthToken = require("../middlewares/auth");
const verifyAdmin = require("../middlewares/admin");
const getDateFilter = require("../utils/getDateFilter");
const verifyAdminOrManager = require("../middlewares/adminOrManager");

const productsRoute = ({ productsCollection, ObjectId }) => {
  const router = express.Router();

  router.post("/", verifyAuthToken, async (req, res) => {
    try {
      const product = req.body;
      await productsCollection.insertOne({ ...product, createdAt: new Date() });
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
  router.get("/", async (req, res) => {
    try {
      const query = {};
      const {
        email,
        featured,
        limit,
        fields,
        category,
        search,
        time,
        sort,
        skip,
        payMethod,
      } = req.query;
      if (email) {
        query.managerEmail = email;
      }
      if (category) {
        query.category = category;
      }
      if (featured) {
        query.markFeatured = Boolean(featured);
      }
      if (payMethod) {
        query.paymentMethod = payMethod;
      }
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }
      if (time && time !== "") {
        const dateFilter = getDateFilter(time);
        query.createdAt = dateFilter;
      }
      let dataSkip = 0;
      if (skip) {
        dataSkip = parseInt(skip);
      }
      const sortQuery = {};
      if (sort) {
        const [field, direction] = sort.split("-");
        sortQuery[field] = direction === "asc" ? 1 : -1;
      } else {
        sortQuery.createdAt = -1;
      }
      const projectFields = {};
      if (fields) {
        fields.split(",").map((f) => (projectFields[f.trim()] = 1));
      }
      const result = await productsCollection
        .find(query)
        .collation({ locale: "en", strength: 1 })
        .limit(parseInt(limit) || 0)
        .project(projectFields)
        .skip(dataSkip)
        .sort(sortQuery)
        .toArray();
      const count = await productsCollection.countDocuments(query);
      res.send({ result, count });
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
  router.delete(
    "/:id",
    verifyAuthToken,
    verifyAdminOrManager,
    async (req, res) => {
      try {
        const { id } = req.params;
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch {
        res.status(500).send({ message: "Server failed to delete product" });
      }
    }
  );
  router.patch(
    "/:id/markFeatured",
    verifyAuthToken,
    verifyAdmin,
    async (req, res) => {
      try {
        const status = req.body;
        console.log("markFeatured", status);
        const query = { _id: new ObjectId(req.params.id) };
        const updateDoc = {
          $set: {
            markFeatured: status.markFeatured,
          },
        };
        const result = await productsCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Server failed to update product" });
      }
    }
  );
  router.patch(
    "/:id",
    verifyAuthToken,
    verifyAdminOrManager,
    async (req, res) => {
      try {
        const productData = req.body;
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };
        const updateProduct = {
          $set: {
            name: productData.name,
            category: productData.category,
            price: productData.price,
            description: productData.description,
            minOrderAmount: productData.minOrderAmount,
            availableQuantity: productData.availableQuantity,
            markFeatured: productData.markFeatured,
            paymentMethod: productData.paymentMethod,
            images: productData.images,
          },
        };
        const result = productsCollection.updateOne(query, updateProduct);
        res.send(result);
      } catch {
        res.status(500).send({ message: "Failed to update product" });
      }
    }
  );
  return router;
};

module.exports = productsRoute;
