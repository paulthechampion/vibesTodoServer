import cron from "node-cron";
import Todo from "./models/Todo.js";
import User from "./models/User.js";
import axios from "axios";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export default function () {
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const inOneMinute = new Date(now.getTime() + 60 * 1000);

    // Find todos with deadlines within the next minute, not done
    const todos = await Todo.find({
      done: false,
      deadline: { $gte: now, $lt: inOneMinute }
    });

    for (const todo of todos) {
      const user = await User.findById(todo.userId);
      if (user && user.expoPushToken) {
        await axios.post(EXPO_PUSH_URL, {
          to: user.expoPushToken,
          title: "To-Do Deadline!",
          body: `Task "${todo.title}" is due now!`,
          sound: "default"
        });
      }
    }
  });
}