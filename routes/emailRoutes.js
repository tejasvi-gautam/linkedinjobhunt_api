import { Router } from "express";

import { generateEmail, sendEmail } from "../controllers/emailController.js";

const router = Router();

router.post("/generate", generateEmail);
router.post("/send", sendEmail);

export default router;
