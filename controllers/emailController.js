import { generateColdEmail } from "../services/geminiService.js";
import { sendColdEmail } from "../services/emailService.js";
import { isValidEmail } from "../utils/validation.js";

export async function generateEmail(req, res, next) {
  try {
    const { jobTitle, company } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({
        success: false,
        message: "jobTitle and company are required"
      });
    }

    const email = await generateColdEmail({ jobTitle, company });

    return res.json({
      success: true,
      email
    });
  } catch (error) {
    next(error);
  }
}

export async function sendEmail(req, res, next) {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "to, subject, and body are required"
      });
    }

    if (!isValidEmail(to)) {
      return res.status(400).json({
        success: false,
        message: "to must be a valid email address"
      });
    }

    const result = await sendColdEmail({ to, subject, body });

    return res.json({
      success: true,
      message: "Email sent",
      data: result
    });
  } catch (error) {
    next(error);
  }
}
