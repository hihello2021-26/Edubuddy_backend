const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/govExamController");

router.get("/", ctrl.list);
router.get("/details", ctrl.getExamDetails);
router.get("/categories", ctrl.categoryCounts);
router.post("/run-now", ctrl.runNow);
router.post("/roadmap", ctrl.generateExamRoadmap);

module.exports = router;

