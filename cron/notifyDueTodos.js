import mongoose from "mongoose";
import Todo from "../models/Todo.js";
import User from "../models/User.js";
import { sendPushNotification } from "../utils/sendPushNotification.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const MONGODB_URI = process.env.MONGODB_URI;

export async function notifyDueTodos() {
  await mongoose.connect(MONGODB_URI);

  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 1000); // 1 min ago
  const windowEnd = new Date(now.getTime() + 60 * 1000); // 1 min ahead

  // Find todos due now and not done
  const todos = await Todo.find({
    done: false,
    deadline: { $gte: windowStart, $lte: windowEnd }
  });

  for (const todo of todos) {
    const user = await User.findById(todo.userId);
    if (user && user.expoPushToken) {
      await sendPushNotification(user.expoPushToken, {
        title: "Task Due!",
        body: `Your task "${todo.title}" is due now.`,
        data: { todoId: todo._id }
      });
    }
  }

  await mongoose.disconnect();
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  notifyDueTodos().then(() => {
    console.log("Checked for due todos and sent notifications.");
    process.exit(0);
  });
}