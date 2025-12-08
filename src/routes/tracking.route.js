const express = require("express");
const trackingRoute = ({ trackingCollection }) => {
  const router = express.Router();
  router.get("/:trackingId/logs", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const result = await trackingCollection.find({ trackingId }).toArray();
      res.send(result);
    } catch {
      res.status(500).send({ message: "Internal Server Error" });
    }
  });

  return router;
};

module.exports = trackingRoute;
