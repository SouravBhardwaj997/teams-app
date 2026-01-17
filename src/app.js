import express from "express";
import cors from "cors";

import { errorHandler } from "./middlewares/errorHandler.middleware.js";
// Import routes
import authRoutes from "./routes/auth.route.js";
import teamRoutes from "./routes/team.route.js";
import taskRoutes from "./routes/task.route.js";
import commentRoutes from "./routes/comment.route.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/teams/:teamId/tasks", taskRoutes);
app.use("/api/teams/:teamId/tasks/:taskId/comments", commentRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
