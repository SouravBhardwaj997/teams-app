import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
