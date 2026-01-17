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
