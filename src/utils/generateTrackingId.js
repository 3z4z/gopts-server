const crypto = require("crypto");

function generateTrackingId() {
  const prefix = "GOPTS";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomBytes = crypto.randomBytes(4).toString("hex");
  return `${prefix}-${date}-${randomBytes}`;
}

module.exports = generateTrackingId;
