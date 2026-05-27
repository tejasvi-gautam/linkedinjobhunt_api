import { Router } from "express";

import { runAutomation } from "../controllers/automationController.js";

const router = Router();

router.post("/run", runAutomation);

export default router;
