import { prisma } from "@repo/db/client";
import { Request, Response } from "express";

export async function saveUserSkills(req: Request, res: Response) {
  const userId = req.userId;
  const { skill_set } = req.body;

  if (!userId || !Array.isArray(skill_set)) {
    res.status(400).json({
      success: false,
      message:
        "Invalid request. skill_set must be an array and user must be authenticated.",
    });
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

    res.status(200).json({
      success: true,
      message: "Skills saved successfully",
      count: skill_set.length,
    });
  } catch (error: any) {
    console.error("❌ Error saving skills:", error);
    res.status(500).json({
      success: false,
      message: "Server error while saving skills",
      error: error.message,
    });
  }
}

export async function getUserSkills(req: Request, res: Response) {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized. Missing userId.",
    });
  }

  try {
    const skills = await prisma.userSkill.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: {
        user_id: userId,
        skill_set: skills.map((s) => ({
          skill_name: s.skillName,
          experience_level: s.experienceLevel,
          description: s.description,
          ...(s.focusArea && { focus_area: s.focusArea }),
          ...(s.components.length > 0 && { components: s.components }),
          ...(s.tools.length > 0 && { tools: s.tools }),
        })),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching skills:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching skills",
      error: error.message,
    });
  }
}
