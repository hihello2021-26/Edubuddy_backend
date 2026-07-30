const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/knowledgeController");

router.get("/", ctrl.list);
router.get("/search", ctrl.search);

module.exports = router;
