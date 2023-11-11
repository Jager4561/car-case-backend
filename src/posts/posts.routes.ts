import multer from 'multer';
const tempPath = process.env.TEMP_PATH || 'temp/';
const upload = multer({ dest: tempPath });
import { Router } from "express";
import { getPostsController } from "./getPosts.controller";
import { sessionMiddleware } from "../middlewares/sessionMiddleware";
import { getSinglePostController } from "./getSinglePostControlller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { ratePostController } from "./ratePost.controller";
import { deleteRateController } from "./deleteRate.controller";
import { createReportController } from "./createReport.controller";
import { createPostController } from './createPost.controller';
import { deletePostController } from './deletePost.controller';
import { editPostController } from './editPost.controller';

const router = Router();

router.get('/', sessionMiddleware, getPostsController);
router.get('/:id', sessionMiddleware, getSinglePostController);
router.post('/', isAuthenticated, sessionMiddleware, upload.array('images[]'), createPostController);
router.patch('/:id', isAuthenticated, sessionMiddleware, upload.array('images[]'), editPostController);
router.delete('/:id', isAuthenticated, sessionMiddleware, deletePostController);

router.post('/rate/:id', isAuthenticated, sessionMiddleware, ratePostController);
router.delete('/rate/:id', isAuthenticated, sessionMiddleware, deleteRateController);

router.post('/report', sessionMiddleware, createReportController);

export default router;