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
