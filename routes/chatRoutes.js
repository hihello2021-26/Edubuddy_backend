const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/chatController");

router.get("/", auth, ctrl.getSessions);
router.get("/:sessionId", auth, ctrl.getSession);
router.post("/message", auth, ctrl.sendMessage);
router.post("/:sessionId/message", auth, ctrl.sendMessage);
router.post("/:sessionId/regenerate", auth, ctrl.regenerate);
router.patch("/:sessionId/messages/:messageId/feedback", auth, ctrl.setFeedback);

module.exports = router;
