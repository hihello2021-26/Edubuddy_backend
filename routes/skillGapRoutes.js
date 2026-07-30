const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/skillGapController");

router.post("/gap", auth, ctrl.analyze);

module.exports = router;
