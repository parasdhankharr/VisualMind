import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    xp: { type: Number, default: 120 },
    streak: { type: Number, default: 1 },
    badges: { type: [String], default: ["First Spark"] }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
