const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

//app setup
const app = express();
dotenv.config();
app.use(
  cors({
    origin: [process.env.SITE_DOMAIN, "https://gopts.netlify.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//configs
const { connectDB } = require("./config/db");

// routes
const usersRoute = require("./routes/users.route");
const uploadRoute = require("./routes/upload.route");
const categoryRoute = require("./routes/category.route");
const productsRoute = require("./routes/products.route");
const ordersRoute = require("./routes/orders.route");
const paymentRoute = require("./routes/payment.route");
const trackingRoute = require("./routes/tracking.route");

const port = process.env.PORT || 3000;

async function startServer() {
  const collections = await connectDB();
  app.locals.usersCollection = collections.usersCollection;
  app.locals.trackingCollection = collections.trackingCollection;

  app.get("/", async (_, res) => {
    res.send("Server is running");
  });
  app.use("/users", usersRoute(collections));
  app.use("/categories", categoryRoute(collections));
  app.use("/products", productsRoute(collections));
  app.use("/orders", ordersRoute(collections));
  app.use("/payment", paymentRoute(collections));
  app.use("/tracking", trackingRoute(collections));

  app.use("/upload", uploadRoute());

  app.listen(port, () => {
    console.log(`Server is running from: http://localhost:${port}`);
  });
}

startServer().catch(console.dir);
