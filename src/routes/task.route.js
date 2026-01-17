import express from "express";
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Protect all task routes
router.use(protect);

router.route("/").post(createTask).get(getTasks);

router.route("/:taskId").get(getTask).put(updateTask).delete(deleteTask);

export default router;
