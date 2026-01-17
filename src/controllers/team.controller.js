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
