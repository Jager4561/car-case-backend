import { Router } from 'express';
import multer from 'multer';
const tempPath = process.env.TEMP_PATH || 'temp/';
const upload = multer({ dest: tempPath });
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { sessionMiddleware } from '../middlewares/sessionMiddleware';
import { getAccountController } from './getAccount.controller';
import { updateAvatarController } from './updateAvatar.controller';
import { updateAccountController } from './updateAccount.controller';
import { changePasswordController } from './changePassword.controller';
import { deleteAvatarController } from './deleteAvatar.controller';

const router = Router();

router.get('/', isAuthenticated, sessionMiddleware, getAccountController);
router.post('/avatar', upload.single('avatar'), isAuthenticated, sessionMiddleware, updateAvatarController);
router.delete('/avatar', isAuthenticated, sessionMiddleware, deleteAvatarController);
router.patch('/', isAuthenticated, sessionMiddleware, updateAccountController);
router.post('/password', isAuthenticated, sessionMiddleware, changePasswordController);

export default router;