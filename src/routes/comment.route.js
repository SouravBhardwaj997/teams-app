import express from "express";
import { addComment, getComments } from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Protect all comment routes
router.use(protect);

router.route("/").post(addComment).get(getComments);

export default router;
