import { Router } from "express";
import {createInvitaion,getAllInvitationSendByThatParticularUser,getAllInvitationRecivedByUser,AcceptInvitation,RejectInvitation} from "../controllers/invitation.controller"

const router: Router = Router();

router.route("/createInvitation").post(createInvitaion)
router.route("/getAllInvitationSendBytheUser/:senderId").get(getAllInvitationSendByThatParticularUser)
router.route("/getAllInvitationRecivedBytheUser/:receiverId").get(getAllInvitationRecivedByUser)
router.route("/acceptInvitation/:id").patch(AcceptInvitation)
router.route("/rejectInvitation/:id").patch(RejectInvitation)

export default router