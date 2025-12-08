const attachAdminFlag = async (req, res, next) => {
  try {
    const usersCollection = req.app.locals.usersCollection;

    if (!req.auth_email) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const user = await usersCollection.findOne({
      email: req.auth_email,
    });

    req.isAdmin = ["admin", "super admin"].includes(
      (user?.role || "").toLowerCase()
    );

    next();
  } catch (err) {
    console.error("Admin check failed:", err);
    return res.status(500).send({ message: "Server error" });
  }
};

module.exports = attachAdminFlag;
