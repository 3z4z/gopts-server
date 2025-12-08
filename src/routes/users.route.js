const express = require("express");
const verifyAuthToken = require("../middlewares/auth");
const verifyAdmin = require("../middlewares/admin");

const usersRoute = ({ usersCollection, ObjectId }) => {
  const router = express.Router();
  const userDefaultRole = "Buyer";

  router.post("/", async (req, res) => {
    try {
      const user = req.body;
      user.role = user.role || userDefaultRole;
      user.status = "pending";
      user.createdAt = new Date().toISOString();
      const existedUser = await usersCollection.findOne({ email: user?.email });
      if (existedUser) {
        return res.send({ message: "User exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    } catch {
      res
        .status(500)
        .send({ message: "Internal Server failed to create a new user" });
    }
  });
  router.get("/", verifyAuthToken, verifyAdmin, async (req, res) => {
    try {
      const query = {};
      const { search, role } = req.query;

      if (role) {
        query.role = role;
      }

      if (search) {
        query.$or = [
          { email: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
        ];
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Server failed to fetch users" });
    }
  });
  router.get("/:email/role", verifyAuthToken, async (req, res) => {
    try {
      const { email } = req.params;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role || userDefaultRole });
    } catch {
      res.status(500).send({ message: "Server failed to fetch user role" });
    }
  });
  router.patch("/:id", verifyAuthToken, verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const statusInfo = req.body;
      const query = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: {
          status: statusInfo.status,
        },
      };
      const result = await usersCollection.updateOne(query, updateStatus);
      res.send(result);
    } catch {
      res.status(500).send({ message: "Failed to update user status" });
    }
  });
  return router;
};

module.exports = usersRoute;
