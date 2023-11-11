import { Router } from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { sessionMiddleware } from '../middlewares/sessionMiddleware';
import { addCommentController } from './addComment.controller';
import { deleteCommentController } from './deleteComment.controller';
import { editCommentController } from './editComment.controller';
import { rateCommentController } from './rateComment.controller';
import { createReportController } from './createReport.controller';

const router = Router();

router.post('/', isAuthenticated, sessionMiddleware, addCommentController);
router.post('/rate/:id', isAuthenticated, sessionMiddleware, rateCommentController);
router.patch('/:id', isAuthenticated, sessionMiddleware, editCommentController);
router.delete('/:id', isAuthenticated, sessionMiddleware, deleteCommentController);

router.post('/report', sessionMiddleware, createReportController);

export default router;