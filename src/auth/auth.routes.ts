import { Router } from 'express';
import { changePasswordController } from './change-password.controller';
import { loginController } from './login.controller';
import { logoutController } from './logout.controller';
import { pingController } from './ping.controller';
import { resetPasswordController } from './reset-password.controller';
import { resendResetEmailController } from './resend-reset-email.controller';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const router = Router();
router.post('/login', loginController);
router.get('/ping', isAuthenticated, pingController);
router.post('/logout', logoutController);
router.post('/reset-password', resetPasswordController);
router.post('/resend-reset-email', resendResetEmailController);
router.post('/change-password', changePasswordController);

export default router;
