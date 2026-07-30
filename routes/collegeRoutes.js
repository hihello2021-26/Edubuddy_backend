const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/collegeController");

router.post("/predict", auth, ctrl.predict);

module.exports = router;
