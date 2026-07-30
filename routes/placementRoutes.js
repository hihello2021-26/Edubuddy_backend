const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/placementController");
const readinessCtrl = require("../controllers/placementReadinessController");

router.post("/prep", auth, ctrl.prep);
router.post("/mock-interview", auth, ctrl.mockInterview);
router.post("/mock-interview/complete", auth, ctrl.completeInterview);
router.post("/coding-generate", auth, ctrl.generateCodingProblem);
router.post("/coding-evaluate", auth, ctrl.evaluateCodingSolution);
router.get("/readiness", auth, readinessCtrl.getMine);
router.patch("/readiness", auth, readinessCtrl.updateSelfReported);

module.exports = router;

