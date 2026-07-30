const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/dashboardController");

router.get("/", auth, ctrl.getDashboard);
router.patch("/class-level", auth, ctrl.updateClassLevel);
router.patch("/profile", auth, ctrl.updateProfile);
router.patch("/preferences", auth, ctrl.updatePreferences);

module.exports = router;
