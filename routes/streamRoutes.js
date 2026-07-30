const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/streamController");

router.get("/class10", ctrl.getClass10Streams);
router.get("/puc12", ctrl.getPuc12Options);
router.post("/counselor", auth, ctrl.getCounselorRecommendation);
router.post("/roadmap", auth, ctrl.getStreamRoadmap);

module.exports = router;
