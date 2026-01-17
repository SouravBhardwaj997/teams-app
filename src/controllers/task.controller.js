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
