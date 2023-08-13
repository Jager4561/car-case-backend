import { Router } from "express";
import { registerController } from "./register.controller";
import { resendActivationController } from "./resend-activation.controller";
import { activateController } from "./activate.controller";

const router = Router();

router.post('/', registerController);
router.post('/resend', resendActivationController);
router.post('/activate', activateController);

export default router;