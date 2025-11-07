import { Router } from "express";
import { saveUserSkills, getUserSkills } from "../controllers/skill.controller";
import { authenticatedUser } from "../middleware/auth.middleware";

const router: Router = Router();

router.route("/getSkill").get(authenticatedUser, getUserSkills);
router.route("/saveSkill").post(authenticatedUser, saveUserSkills);

export default router;
