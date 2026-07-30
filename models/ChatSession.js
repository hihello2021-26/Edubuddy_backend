const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
    language: { type: String, enum: ["en", "hi", "kn"], default: "en" },
    sources: [{ type: String }], // RAG-retrieved doc titles cited in this reply
    agentCategory: { type: String, default: "" }, // which agent answered (career/scholarship/govexam/... or "mentor")
    feedback: { type: String, enum: ["like", "dislike", null], default: null },
  },
  { timestamps: true }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New conversation" },
    language: { type: String, enum: ["en", "hi", "kn"], default: "en" },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
