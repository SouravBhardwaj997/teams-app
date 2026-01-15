import { Schema, model } from "mongoose";

export const commentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    taskId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Task",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = model("Comment", commentSchema);

export default Comment;
