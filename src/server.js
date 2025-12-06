const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const usersRoute = require("./routes/users.route");
const uploadRoute = require("./routes/upload.route");
const categoryRoute = require("./routes/category.route");
const productsRoute = require("./routes/prodcuts.route");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

async function startServer() {
  const collections = await connectDB();
  app.locals.usersCollection = collections.usersCollection;
  app.locals.categoriesCollection = collections.categoriesCollection;
  app.locals.productsCollection = collections.productsCollection;

  app.get("/", async (_, res) => {
    res.send("Server is running");
  });
  app.use("/users", usersRoute(collections));
  app.use("/categories", categoryRoute(collections));
  app.use("/products", productsRoute(collections));

  app.use("/upload", uploadRoute());

  app.listen(port, () => {
    console.log(`Server is running from: http://localhost:${port}`);
  });
}

startServer().catch(console.dir);
