import { Router } from "express";

import { scrapeJobs } from "../controllers/jobController.js";

const router = Router();

router.get("/scrape", scrapeJobs);

export default router;
