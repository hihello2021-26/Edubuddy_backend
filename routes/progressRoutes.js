const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/progressController");

router.get("/", auth, ctrl.getProgress);

module.exports = router;
