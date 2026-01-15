import { Schema, model } from "mongoose";

const teamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tasks: {
      type: [Schema.Types.ObjectId],
      ref: "Task",
    },
  },
  {
    timestamps: true,
  }
);

const Team = model("team", teamSchema);

export default Team;
