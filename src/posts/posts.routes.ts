import { Router } from "express";
import { getPostsController } from "./getPosts.controller";
import { sessionMiddleware } from "../middlewares/sessionMiddleware";

const router = Router();

router.get('/', sessionMiddleware, getPostsController);

export default router;