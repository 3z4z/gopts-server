const logTracking = async (
  req,
  orderId,
  trackingId,
  deliveryStatus,
  details,
  location
) => {
  try {
    const trackingCollection = req.app.locals.trackingCollection;
    const log = {
      orderId,
      trackingId,
      deliveryStatus,
      details: details || deliveryStatus.split("_").join(" "),
      createdAt: new Date(),
      location: location ? location : "",
    };
    const result = await trackingCollection.insertOne(log);
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = logTracking;
