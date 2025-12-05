const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

async function startServer() {
  const collections = await connectDB();
  app.get("/", async (_, res) => {
    res.send("Server is running");
  });

  app.listen(port, () => {
    console.log(`Server is running from: http://localhost:${port}`);
  });
}

startServer().catch(console.dir);
