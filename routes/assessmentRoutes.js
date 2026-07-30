const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/assessmentController");

router.post("/", auth, ctrl.createAssessment);
router.get("/", auth, ctrl.getMyAssessments);
router.get("/:id", auth, ctrl.getAssessment);

module.exports = router;
