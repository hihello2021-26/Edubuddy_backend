const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/careerRoadmapController");

router.post("/roadmap", auth, ctrl.generate);

module.exports = router;
