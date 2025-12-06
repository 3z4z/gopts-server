const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGO_URI from environment");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db, usersCollection;
const connectDB = async () => {
  try {
    await client.connect();
    console.log("Successfully connected to DB");
    db = client.db("goptsDB");
    usersCollection = db.collection("users");
    return {
      usersCollection,
      ObjectId,
    };
  } catch {
    console.log("Mongodb connection failed");
    process.exit(1);
  }
};

module.exports = { connectDB, ObjectId };
