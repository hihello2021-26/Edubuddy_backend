const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/scholarshipController");

router.get("/", ctrl.list);

module.exports = router;
