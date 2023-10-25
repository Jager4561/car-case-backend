import { Router } from "express";
import { getModelsController } from "./getModels.controller";
import { getFiltersController } from "./getFilters.controller";

const router = Router();

router.get('/', getModelsController);
router.get('/filters', getFiltersController);

export default router;