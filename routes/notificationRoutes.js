const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/notificationController");

router.get("/", ctrl.list);
router.get("/mine", auth, ctrl.listMine);
router.patch("/:id/read", auth, ctrl.markRead);
router.patch("/mark-all-read", auth, ctrl.markAllRead);
router.post("/run-now", ctrl.runNow);

module.exports = router;
