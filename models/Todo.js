import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "TodoUser", required: true },
  title: { type: String, required: true },
  deadline: { type: Date, required: true },
  done: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Todo", todoSchema);