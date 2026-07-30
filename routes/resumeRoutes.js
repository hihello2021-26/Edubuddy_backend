const express = require("express");
const multer = require("multer");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/resumeController");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/analyze", auth, upload.single("file"), ctrl.analyze);
router.get("/history", auth, ctrl.history);

module.exports = router;
