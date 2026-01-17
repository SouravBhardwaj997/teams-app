# Project Setup

### Create db cluster and copy its string and paste it in .env file

`.env`

## Folder strucutre

```
src/
----config/
----------db.js
----controllers/
----------auth.controller.js
----middlewares/
----------auth.middleware.js
----routes/
----------auth.route.js
----utils/
----------validation.js
----app.js
server.js
.env
```

```
PORT=8001
MONGO_URI=your-mongo-uri
JWT_SECRET=Secret
```

### install packages for now

`npm i express mongoose jsonwebtoken bcryptjs dotenv cors`

### create src folder and inside it create app.js

`src/model/app.js`

```js
import express from "express";
import cors from "cors";

const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

export default app;
```

> write only this code for now

## Schemas inside src/models

`src/model/user.model.js`

```js
import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
```

`src/model/team.model.js`

```js
import mongoose from "mongoose";
const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Team", teamSchema);
```

`src/model/task.model.js`

```js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["TODO", "DOING", "DONE"],
      default: "TODO",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ team: 1, status: 1 });
taskSchema.index({ team: 1, assignedTo: 1 });

export default mongoose.model("Task", taskSchema);
```

`src/model/comment.model.js`

```js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ task: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
```

## Schemas DONE

\*\*
add this line in your app.js file

`src/app.js`

```js
app.use("/api/auth", authRoutes);
```

### Create Auth Route

`src/routes/user.route.js`
\*\*

```js
import express from "express";
import { register, login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;
```

### Create Validate Utils function

`src/utils/validation.js`

```js
export const validateEmail = (email) => {
  const re = /^\S+@\S+\.\S+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRequired = (fields, body) => {
  const errors = [];

  for (const field of fields) {
    if (!body[field] || body[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }

  return errors;
};
```

### Create Auth Controller

`src/routes/user.controller.js`

```js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from "../utils/validations.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    const requiredErrors = validateRequired(
      ["name", "email", "password"],
      req.body
    );
    if (requiredErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: requiredErrors.join(", "),
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Validate password length
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    const requiredErrors = validateRequired(["email", "password"], req.body);
    if (requiredErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: requiredErrors.join(", "),
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

## AUTH API DONE

### Teams API

add this line in your app.js file

`src/app.js`

```js
app.use("/api/teams", teamRoutes);
```

### Create Protect Middleware

`src/middlewares/auth.middleware.js`

```js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};
```

### Create Teams Route

`src/routes/team.route.js`

```js
import express from "express";
import {
  createTeam,
  getMyTeams,
  getTeam,
  addMember,
  removeMember,
} from "../controllers/team.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all team routes
router.use(protect);

router.route("/").post(createTeam).get(getMyTeams);

router.route("/:id").get(getTeam);

router.route("/:id/members").post(addMember);

router.route("/:id/members/:userId").delete(removeMember);

export default router;
```

### Create Teams Controllers

`src/controllers/team.controller.js`

```js
import Team from "../models/team.model.js";
import User from "../models/user.model.js";
import { validateRequired } from "../utils/validations.js";

export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    const requiredErrors = validateRequired(["name"], req.body);
    if (requiredErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: requiredErrors.join(", "),
      });
    }

    // Create team with creator as first member
    const team = await Team.create({
      name,
      description: description || "",
      creator: req.user._id,
      members: [req.user._id],
    });

    const populatedTeam = await Team.findById(team._id)
      .populate("creator", "name email")
      .populate("members", "name email");

    res.status(201).json({
      success: true,
      data: populatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ members: req.user._id })
      .populate("creator", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("creator", "name email")
      .populate("members", "name email");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this team",
      });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if requester is the team creator
    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only team creator can add members",
      });
    }

    // Check if user exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this team",
      });
    }

    // Add member
    team.members.push(userId);
    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("creator", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if requester is the team creator
    if (team.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only team creator can remove members",
      });
    }

    // Cannot remove the creator
    if (userId === team.creator.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove team creator",
      });
    }

    // Check if user is a member
    if (!team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this team",
      });
    }

    // Remove member
    team.members = team.members.filter(
      (member) => member.toString() !== userId
    );
    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("creator", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

## TEAM API DONE

### Task API

add this line in your app.js file

`src/app.js`

```js
app.use("/api/teams/:teamId/tasks", taskRoutes);
```

### Create Task Route

`src/routes/task.route.js`

```js
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
```

### Create Task Controllers

`src/controllers/task.controller.js`

```js
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";
import { validateRequired } from "../utils/validations.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status } = req.body;
    const { teamId } = req.params;

    // Validate required fields
    const requiredErrors = validateRequired(["title"], req.body);
    if (requiredErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: requiredErrors.join(", "),
      });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member of the team
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can create tasks",
      });
    }

    // If assignedTo is provided, check if they are a team member
    if (assignedTo) {
      const isAssigneeMember = team.members.some(
        (member) => member.toString() === assignedTo
      );

      if (!isAssigneeMember) {
        return res.status(400).json({
          success: false,
          message: "Can only assign tasks to team members",
        });
      }
    }

    // Validate status if provided
    if (status && !["TODO", "DOING", "DONE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be TODO, DOING, or DONE",
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description: description || "",
      status: status || "TODO",
      assignedTo: assignedTo || null,
      team: teamId,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { page = 1, limit = 10, search, assignedTo, status } = req.query;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can view tasks",
      });
    }

    // Build query
    const query = { team: teamId };

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Filter by assignedTo
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Filter by status
    if (status) {
      if (!["TODO", "DOING", "DONE"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be TODO, DOING, or DONE",
        });
      }
      query.status = status;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get tasks
    const tasks = await Task.find(query)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    // Get total count
    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTask = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can view tasks",
      });
    }

    const task = await Task.findOne({ _id: taskId, team: teamId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;
    const { title, description, assignedTo, status } = req.body;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can update tasks",
      });
    }

    const task = await Task.findOne({ _id: taskId, team: teamId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Validate status if provided
    if (status && !["TODO", "DOING", "DONE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be TODO, DOING, or DONE",
      });
    }

    // If assignedTo is provided, check if they are a team member
    if (assignedTo !== undefined) {
      if (assignedTo !== null && assignedTo !== "") {
        const isAssigneeMember = team.members.some(
          (member) => member.toString() === assignedTo
        );

        if (!isAssigneeMember) {
          return res.status(400).json({
            success: false,
            message: "Can only assign tasks to team members",
          });
        }
      }
    }

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) {
      task.assignedTo =
        assignedTo === "" || assignedTo === null ? null : assignedTo;
    }

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can delete tasks",
      });
    }

    const task = await Task.findOne({ _id: taskId, team: teamId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```

## TASK API DONE

### Comments API

add this line in your app.js file

`src/app.js`

```js
app.use("/api/teams/:teamId/tasks/:taskId/comments", commentRoutes);
```

### Create Comments Route

`src/routes/comment.route.js`

```js
import express from "express";
import { addComment, getComments } from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Protect all comment routes
router.use(protect);

router.route("/").post(addComment).get(getComments);

export default router;
```

### Create Comment Controllers

`src/controllers/comments.controller.js`

```js
import Comment from "../models/comment.model.js";
import Task from "../models/task.model.js";
import Team from "../models/team.model.js";
import { validateRequired } from "../utils/validations.js";

export const addComment = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;
    const { text } = req.body;

    // Validate required fields
    const requiredErrors = validateRequired(["text"], req.body);
    if (requiredErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: requiredErrors.join(", "),
      });
    }

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can comment on tasks",
      });
    }

    // Check if task exists and belongs to the team
    const task = await Task.findOne({ _id: taskId, team: teamId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Create comment
    const comment = await Comment.create({
      text,
      task: taskId,
      createdBy: req.user._id,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "createdBy",
      "name email"
    );

    res.status(201).json({
      success: true,
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { teamId, taskId } = req.params;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if user is a member
    const isMember = team.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only team members can view comments",
      });
    }

    // Check if task exists
    const task = await Task.findOne({ _id: taskId, team: teamId });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Get comments
    const comments = await Comment.find({ task: taskId })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
```
