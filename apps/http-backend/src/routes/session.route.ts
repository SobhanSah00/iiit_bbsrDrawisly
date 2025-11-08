import express, { Router } from "express";
import { upload } from "../middleware/upload.middleware";
import { uploadSessionRecording } from "../controllers/session.controller";
import { authenticatedUser } from "../middleware/auth.middleware";

const router:Router = express.Router();

// POST /api/v1/session/upload-recording
router.post(
  "/upload-recording",
  upload.single("video"),   
  authenticatedUser,
  uploadSessionRecording
);

export default router;
