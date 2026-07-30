const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    classLevel: {
      type: String,
      enum: ["10", "puc12", "degree", "other"],
      default: "10",
    },
    location: { type: String, default: "" },
    preferredLanguage: { type: String, enum: ["en", "hi", "kn"], default: "en" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },

    // Student profile fields used by the AI counselor / college predictor / skill-gap agents
    profile: {
      marks: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { class10: 88, puc: 91, subjects: {...} }
      entranceScores: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { jee: 92, neet: 550, cet: 145 }
      aptitude: [{ type: String }],
      interests: [{ type: String }],
      personality: { type: String, default: "" }, // short free-text or MBTI-like tag
      goals: { type: String, default: "" },
      skills: [{ type: String }],
      targetRole: { type: String, default: "" },
    },

    // Gamification
    badges: [
      {
        code: String,
        title: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    xp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", UserSchema);
