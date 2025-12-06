const express = require("express");

const usersRoute = ({ usersCollection, ObjectId }) => {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const user = req.body;
      user.role = user.role || "buyer";
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
  return router;
};

module.exports = usersRoute;
