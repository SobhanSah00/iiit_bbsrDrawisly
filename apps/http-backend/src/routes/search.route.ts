import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { authenticatedUser } from "../middleware/auth.middleware";

const router: Router = Router();
router.post("/postSearch", authenticatedUser, searchController);

export default router;
