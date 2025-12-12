const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const crypto = require("crypto");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const randomId = crypto.randomBytes(6).toString("hex");
    let transformation = {
      crop: "fill",
      fetch_format: "auto",
      quality: "auto",
    };
    let folder = "gopts-images";
    let ratio = null;
    let gravity = null;
    if (file?.fieldname === "profileImage") {
      ratio = "1:1";
      gravity = "auto";
      folder = "gopts-images/users";
    }
    if (file?.fieldname === "productImages") {
      folder = "gopts-images/products";
    }
    return {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "jfif", "avif"],
      public_id: `${file?.fieldname}-${Date.now()}-${randomId}`,
      transformation: ratio
        ? [{ ...transformation, aspect_ratio: ratio, gravity }]
        : undefined,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
