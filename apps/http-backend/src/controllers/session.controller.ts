import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@repo/db/client";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadSessionRecording = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(400).json({
                error: "You are  not the authenticated ."
            })
        }
        const { roomId } = req.body;

        if (!roomId) {
            res.status(400).json({ error: "roomId is required" });
        }

        if (!req.file) {
            res.status(400).json({ error: "No video file uploaded" });
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "video",
                folder: "skill-sessions",
            },
            async (error, result) => {
                if (error) {
                    console.error("Cloudinary Error:", error);
                    res.status(500).json({ error: "Upload failed" });
                }

                // data base save
                const recording = await prisma.sessionRecording.create({
                    data: {
                        roomId,
                        url: result?.secure_url || "",
                        duration: result?.duration || null,
                        size: result?.bytes || null,
                    },
                });

                res.json({
                    success: true,
                    recording,
                });
            }
        );

        // Pipe kardiya because of video file stream ho raha he  
        uploadStream.end(req.file?.buffer);

    } catch (err: any) {
        console.error("Recording Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
};
