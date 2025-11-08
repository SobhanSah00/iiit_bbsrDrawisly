import { prisma } from "@repo/db/client";
import { Request, Response } from "express";
import axios from "axios";

// Define the return type explicitly
interface UserSkillsResponse {
  user_id: string;
  skill_set: Array<{
    skill_name: string;
    experience_level: string;
    description: string;
    focus_area?: string;
    components?: string[];
    tools?: string[];
  }>;
}

// Add explicit return type annotation
export async function fetchUserSkills(
  userId: string
): Promise<UserSkillsResponse> {
  const skills = await prisma.userSkill.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    user_id: userId,
    skill_set: skills.map((s) => ({
      skill_name: s.skillName,
      experience_level: s.experienceLevel,
      description: s.description,
      ...(s.focusArea && { focus_area: s.focusArea }),
      ...(s.components.length > 0 && { components: s.components as string[] }),
      ...(s.tools.length > 0 && { tools: s.tools as string[] }),
    })),
  };
}

export async function saveUserSkills(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.userId;
  const { skill_set } = req.body;

  if (!userId || !Array.isArray(skill_set)) {
    res.status(400).json({
      success: false,
      message:
        "Invalid request. skill_set must be an array and user must be authenticated.",
    });
    return;
  }

  try {
    await prisma.userSkill.deleteMany({
      where: { userId },
    });

    const skillInsertPayload = skill_set.map((skill: any) => ({
      userId,
      skillName: skill.skill_name,
      experienceLevel: skill.experience_level.toUpperCase(),
      description: skill.description,
      focusArea: skill.focus_area || null,
      components: skill.components ?? [],
      tools: skill.tools ?? [],
    }));

    await prisma.userSkill.createMany({
      data: skillInsertPayload,
    });

    try {
      await axios.post("http://localhost:8000/user-profile-upload", {
        user_id: userId,
        skill_set: skill_set,
      });
    } catch (postError: any) {
      console.error("⚠️ Error posting to external backend:", postError.message);
    }

    res.status(200).json({
      success: true,
      message: "Skills saved successfully and posted to external backend",
      count: skill_set.length,
    });
  } catch (error: any) {
    console.error("Error saving skills:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving skills",
      error: error.message,
    });
  }
}

export async function getUserSkills(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized. Missing userId.",
    });
    return;
  }

  try {
    const data = await fetchUserSkills(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Error fetching skills:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching skills",
      error: error.message,
    });
  }
}
