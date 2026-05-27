import { scrapeLinkedInJobs } from "../services/jobScraperService.js";
import { parseLimit } from "../utils/validation.js";

export async function scrapeJobs(req, res, next) {
  try {
    const { keyword } = req.query;
    const limit = parseLimit(req.query.limit, 5);

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "keyword query parameter is required"
      });
    }

    const jobs = await scrapeLinkedInJobs(String(keyword), limit);

    return res.json({
      success: true,
      jobs
    });
  } catch (error) {
    next(error);
  }
}
