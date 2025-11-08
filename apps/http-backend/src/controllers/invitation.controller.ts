import { Request, Response } from "express"
import { prisma } from "@repo/db/client"
import { } from "../controllers/room.controller"
import { reandomeCodeGenerator } from "../utils/randomRoomCodeGenerate";

export async function  createInvitaion(req: Request, res: Response) {
    try {
        const { senderId, receiverId, message } = req.body;

        if (!senderId || !receiverId) {
            res.status(400).json({ error: "senderId and receiverId are required" });
            return;
        }

        if (senderId === receiverId) {
            res.status(400).json({ error: "Cannot send invitation to yourself" });
        }

        // Check for duplicate pending invite
        const existing = await prisma.invitation.findFirst({
            where: { senderId, receiverId, status: "PENDING" },
        });

        if (existing) {
            res.status(400).json({ error: "An invitation is already pending with this user" });
        }

        // Create the invitation
        const invitation = await prisma.invitation.create({
            data: {
                senderId,
                receiverId,
                message,
            },
            include: {
                sender: { select: { id: true, username: true, email: true } },
                receiver: { select: { id: true, username: true, email: true } },
            },
        });

        res.status(201).json(invitation);
    } catch (err) {
        console.error("Error creating invitation:", err);
        res.status(500).json({ error: "Failed to create invitation" });
    }
};

export async function getAllInvitationSendByThatParticularUser(req: Request, res: Response) {
    try {
        const { senderId } = req.params;
        const invitations = await prisma.invitation.findMany({
            where: { senderId },
            include: { receiver: true },
            orderBy: { createdAt: "desc" },
        });

        res.json(invitations);
    } catch (err) {
        console.error("Error fetching sent invitations:", err);
        res.status(500).json({ error: "Failed to fetch sent invitations" });
    }
};

export async function getAllInvitationRecivedByUser(req: Request, res: Response) {
    try {
        const { receiverId } = req.params;
        const invitations = await prisma.invitation.findMany({
            where: { receiverId },
            include: { sender: true },
            orderBy: { createdAt: "desc" },
        });

        res.json(invitations);
    } catch (err) {
        console.error("Error fetching received invitations:", err);
        res.status(500).json({ error: "Failed to fetch received invitations" });
    }
};

export async function AcceptInvitation(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const receiverId = req.body.userId; // assuming frontend sends current logged in user's ID

        // 1️⃣ Find the invitation
        const invitation = await prisma.invitation.findUnique({ where: { id } });
        if (!invitation) {
            res.status(404).json({ error: "Invitation not found" });
            return;
        }

        if (invitation.status !== "PENDING") {
            res.status(400).json({ error: "Invitation already responded to" });
        }

        // 2️⃣ Validate that the one accepting is the receiver
        if (receiverId !== invitation.receiverId) {
            res.status(403).json({ error: "You are not authorized to accept this invitation" });
        }

        // 3️⃣ Generate join code (you can reuse your random code generator)
        const joincode = reandomeCodeGenerator(7);

        // 4️⃣ Create the room (based on your existing logic)
        const title = req.body.title || "Collaboration Room";

        const room = await prisma.room.create({
            data: {
                title,
                joincode,
                adminId: invitation.senderId, // sender is the admin
                participants: {
                    connect: [
                        { id: invitation.senderId },
                        { id: invitation.receiverId },
                    ],
                },
            },
        });

        // 5️⃣ Update the invitation
        const updatedInvitation = await prisma.invitation.update({
            where: { id },
            data: {
                status: "ACCEPTED",
                acceptedRoomId: room.id,
            },
        });

        // 6️⃣ Respond
        res.status(200).json({
            message: "Invitation accepted successfully. Room created.",
            room,
            invitation: updatedInvitation,
        });

    } catch (err) {
        console.error("Error accepting invitation:", err);
        res.status(500).json({
            error: "Failed to accept invitation",
        });
    }
};

export async function RejectInvitation(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const invitation = await prisma.invitation.findUnique({ where: { id } });
        if (!invitation) {
            res.status(404).json({ error: "Invitation not found" });
            return;
        }

        if (invitation.status !== "PENDING") {
            res.status(400).json({ error: "Invitation already responded to" });
        }

        const updatedInvitation = await prisma.invitation.update({
            where: { id },
            data: { status: "REJECTED" },
        });

        res.json({ message: "Invitation rejected", invitation: updatedInvitation });
    } catch (err) {
        console.error("Error rejecting invitation:", err);
        res.status(500).json({ error: "Failed to reject invitation" });
    }
};
