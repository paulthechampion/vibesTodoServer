import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  expoPushToken: { type: String }
});

// Ensure index is created with unique and lowercase
userSchema.index({ username: 1 }, { unique: true });

export default mongoose.model("TodoUser", userSchema);