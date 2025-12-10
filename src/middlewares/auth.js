const admin = require("firebase-admin");
// const serviceAccount = require("../../go-pts-firebase-adminsdk.json");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyAuthToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({
        message: "Unauthorized Access. Reason: Authorization header missing.",
      });
    }

    const [scheme, authToken] = authorization.split(" ");

    if (scheme !== "Bearer" || !authToken) {
      return res.status(401).send({
        message: "Unauthorized Access. Reason: Invalid Bearer Token format.",
      });
    }

    const userInfo = await admin.auth().verifyIdToken(authToken);

    req.user = userInfo;
    req.auth_email = userInfo.email;

    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res
      .status(401)
      .send({ message: `Unauthorized Access. Token invalid or expired.` });
  }
};

module.exports = verifyAuthToken;
