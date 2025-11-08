import { Router } from "express";
import { saveUserSkills, getUserSkills } from "../controllers/skill.controller";
import { authenticatedUser } from "../middleware/auth.middleware";

const router: Router = Router();

router.route("/saveSkill").post(authenticatedUser, saveUserSkills);
router.route("/getSkill").post(authenticatedUser, getUserSkills);

export default router;
