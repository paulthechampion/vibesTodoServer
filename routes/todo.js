import express from "express";
import jwt from "jsonwebtoken";
import Todo from "../models/Todo.js";
import User from "../models/User.js";
import { sendPushNotification } from "../utils/sendPushNotification.js";

const router = express.Router();

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get all todos (optionally filter by done status)
router.get("/", auth, async (req, res) => {
  const { done } = req.query;
  const filter = { userId: req.user.id };
  if (done !== undefined) filter.done = done === "true";
  const todos = await Todo.find(filter).sort({ deadline: 1 });
  res.json(todos);
});

// Helper: Schedule notification
function scheduleNotification(todo, user) {
  if (!user.expoPushToken) return;
  const deadline = new Date(todo.deadline).getTime();
  const now = Date.now();
  const delay = deadline - now;
  if (delay <= 0) return; // Don't schedule if already past

  setTimeout(async () => {
    try {
      await sendPushNotification(user.expoPushToken, {
        title: "Task Due!",
        body: `Your task "${todo.title}" is due now.`,
        data: { todoId: todo._id }
      });
    } catch (e) {
      console.error("Failed to send push notification:", e);
    }
  }, delay);
}

// Create
router.post("/", auth, async (req, res) => {
  const { title, deadline } = req.body;
  const todo = new Todo({ userId: req.user.id, title, deadline });
  await todo.save();
  // Schedule notification
  const user = await User.findById(req.user.id);
  scheduleNotification(todo, user);
  res.status(201).json(todo);
});

// Update
router.put("/:id", auth, async (req, res) => {
  const { title, deadline, done } = req.body;
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
  if (!todo) return res.status(404).json({ error: "Not found" });
  if (title !== undefined) todo.title = title;
  if (deadline !== undefined) todo.deadline = deadline;
  if (done !== undefined) todo.done = done;
  await todo.save();
  // Schedule notification if deadline updated and not done
  if (deadline && !todo.done) {
    const user = await User.findById(req.user.id);
    scheduleNotification(todo, user);
  }
  res.json(todo);
});

// Delete
router.delete("/:id", auth, async (req, res) => {
  await Todo.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Deleted" });
});

export default router;