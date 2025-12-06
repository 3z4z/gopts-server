const express = require("express");
const upload = require("../middlewares/upload");

const uploadRoute = () => {
  const router = express.Router();
  router.post(
    "/",
    upload.fields([{ name: "profileImage", maxCount: 1 }]),
    async (req, res) => {
      try {
        const profileImage = req.files?.profileImage?.[0];
        if (!profileImage) {
          res.status(400).send({
            success: false,
            message: "Profile image not found",
          });
        }
        return res.send({
          success: true,
          profileImgUrl: profileImage?.path,
        });
      } catch {
        res.status(500).send({
          message: "Internal Server failed to upload an image",
          success: false,
        });
      }
    }
  );
  router.post(
    "/product-images",
    upload.fields([{ name: "productImages" }]),
    async (req, res) => {
      try {
        const files = req.files?.productImages;
        if (!files || files.length === 0) {
          res.status(400).send({
            success: false,
            message: "Profile image not found",
          });
        }
        const productImageUrls = files.map((file) => file.path);
        return res.send({
          success: true,
          productImageUrls: productImageUrls,
        });
      } catch {
        res.status(500).send({
          message: "Internal Server failed to upload an image",
          success: false,
        });
      }
    }
  );
  return router;
};

module.exports = uploadRoute;
