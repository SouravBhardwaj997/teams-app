import { Schema, model } from "mongoose";
import { commentSchema } from "./comment.model.js";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    status: {
      type: String,
      enum: ["TODO", "DOING", "DONE"],
      default: "TODO",
      required: true,
      index: true,
    },
    comments: {
      type: [commentSchema],
    },
  },
  {
    timestamps: true,
  }
);

const Task = model("Task", taskSchema);

export default Task;
