import { Request, Response } from "express";
import axios from "axios";
import { fetchUserSkills } from "../controllers/skill.controller";

// Note: Make sure fetchUserSkills is exported from skill.controller.ts

// Types
interface Skill {
  skill_name: string;
  components?: string[];
  tools?: string[];
  focus_area?: string;
  experience_level: string;
  description: string;
}

interface UserProfile {
  user_id: string;
  skill_set: Skill[];
}

interface SearchPayload {
  query: string;
  user_profile: UserProfile;
}

export const searchController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.body;
    const userId = req.userId;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        error: "Query text is required and must be a string",
      });
      return;
    }

    const userProfile = await fetchUserSkills(userId as string);
    console.log(userProfile);

    if (!userProfile || !userProfile.skill_set) {
      res.status(404).json({
        error: "User profile or skills not found",
      });
      return;
    }

    // Construct payload
    const searchPayload: SearchPayload = {
      query,
      user_profile: userProfile,
    };

    // Post to external backend
    const EXTERNAL_API_URL =
      process.env.EXTERNAL_API_URL || "http://localhost:8000/compatible-users";
    const response = await axios.post(EXTERNAL_API_URL, searchPayload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    // Return the response from external API
    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Search controller error:", error);

    if (axios.isAxiosError(error)) {
      // Handle axios-specific errors
      res.status(error.response?.status || 500).json({
        error: "External API request failed",
        message: error.response?.data?.message || error.message,
      });
    } else {
      // Handle other errors
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};
