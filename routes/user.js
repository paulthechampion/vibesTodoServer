import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// ...existing imports...

// Registration
router.post('/register', async (req, res) => {
  try {
    console.log("Register request body:", req.body);
    let { username, password, expoPushToken } = req.body;
    if (!username || !password) {
      console.log("Missing username or password");
      return res.status(400).json({ error: "Username and password required" });
    }
    username = username.toLowerCase().trim();
    const existing = await User.findOne({ username });
    if (existing) {
      console.log("Username already exists:", username);
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    if (expoPushToken && typeof expoPushToken === "string") user.expoPushToken = expoPushToken;
    await user.save();
    console.log("User registered:", user.username);
    res.status(201).json({ message: "User registered" });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error (unique index violation)
      return res.status(400).json({ error: "Username already exists" });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    let { username, password, expoPushToken } = req.body;
    if (!username || !password) {
      console.log("Missing username or password");
      return res.status(400).json({ error: "Username and password required" });
    }
    username = username.toLowerCase().trim();
    const user = await User.findOne({ username });
    if (!user) {
      console.log("User not found:", username);
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("Invalid password for user:", username);
      return res.status(400).json({ error: "Invalid credentials" });
    }
    if (expoPushToken && typeof expoPushToken === "string" && expoPushToken !== user.expoPushToken) {
      user.expoPushToken = expoPushToken;
      await user.save();
      console.log("Updated expoPushToken for user:", username);
    }
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set in environment");
      return res.status(500).json({ error: "JWT secret not set on server" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.log("User logged in:", username);
    res.json({
      _id: user._id,
      username: user.username,
      expoPushToken: user.expoPushToken,
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;