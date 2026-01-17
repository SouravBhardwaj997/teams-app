import mongoose from "mongoose";
import "dotenv/config";
export const connectDB = async () => {
  console.log("process.env.MONGO_URI", process.env.MONGO_URI);
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo DB connected", conn.connection.host);
  } catch (error) {
    console.log("Error while connecting DB", error);
    process.exit(1);
  }
};
