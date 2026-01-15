import express from "express";
import { connectDB } from "./db/db.js";
import "dotenv/config";
import userRouter from "./routes/user.route.js";
const app = express();
const PORT = process.env.PORT || 8000;

const baseUrl = "/api/v1";
app.use(express.json());
app.get(`${baseUrl}`, (req, res) => {
  return res.json({ success: true, message: "API is healthy" });
});
app.use(`${baseUrl}/user`, userRouter);

app.listen(PORT, () => {
  connectDB();
  console.log("Server is running on PORT", PORT);
});

/*
users => name:string, email:string, password:strings
teams => name:string, teamMember:users[], creator:user, tasks 
- Only the team creator can add/remove members
- Only team members can access or create tasks
tasks => title:string, description:string, status: todo | doing | done, teamId:team, assignedTo: user
comments => title:string, createdBy:user
*/
