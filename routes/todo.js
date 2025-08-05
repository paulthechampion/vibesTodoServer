import express from "express";
import jwt from "jsonwebtoken";
import Todo from "../models/Todo.js";

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

// Create
router.post("/", auth, async (req, res) => {
  const { title, deadline } = req.body;
  const todo = new Todo({ userId: req.user.id, title, deadline });
  await todo.save();
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
  res.json(todo);
});

// Delete
router.delete("/:id", auth, async (req, res) => {
  await Todo.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ message: "Deleted" });
});

export default router;