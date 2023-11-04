import { Router } from "express";
import { getPostsController } from "./getPosts.controller";
import { sessionMiddleware } from "../middlewares/sessionMiddleware";
import { getSinglePostController } from "./getSinglePostControlller";
import { isAuthenticated } from "../middlewares/isAuthenticated";
import { ratePostController } from "./ratePost.controller";
import { deleteRateController } from "./deleteRate.controller";

const router = Router();

router.get('/', sessionMiddleware, getPostsController);
router.get('/:id', sessionMiddleware, getSinglePostController);
/* router.post('/'); // add new post
router.patch('/:id'); // update post
router.delete('/:id'); // delete post */

router.post('/rate/:id', isAuthenticated, sessionMiddleware, ratePostController);
router.delete('/rate/:id', isAuthenticated, sessionMiddleware, deleteRateController);


export default router;