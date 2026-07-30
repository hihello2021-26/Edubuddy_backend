const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/resumeBuilderController");

router.get("/", auth, ctrl.getMine);
router.put("/", auth, ctrl.save);
router.post("/generate", auth, ctrl.generate);
router.get("/export/docx", auth, ctrl.exportDocx);
router.get("/export/pdf", auth, ctrl.exportPdf);

module.exports = router;
