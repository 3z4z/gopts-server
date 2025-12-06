const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let transformation = {
      crop: "fill",
      fetch_format: "auto",
      quality: "auto",
    };
    let ratio = null;
    let gravity = null;
    if (file?.fieldname === "profileImage") {
      ratio = "1:1";
      gravity = "auto";
    }
    return {
      folder: "gopts-images/users",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "jfif"],
      public_id: `${file?.fieldname}-${Date.now()}`,
      transformation: ratio
        ? [{ ...transformation, aspect_ratio: ratio, gravity }]
        : undefined,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
