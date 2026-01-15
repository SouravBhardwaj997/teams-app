import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
export const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
  }
});

const User = model("user", userSchema);

export default User;
