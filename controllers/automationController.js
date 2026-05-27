import { scrapeLinkedInJobs } from "../services/jobScraperService.js";
import { generateColdEmail } from "../services/geminiService.js";
import { sendColdEmail } from "../services/emailService.js";
import { appendApplicationLogs } from "../services/logService.js";
import { buildRecruiterEmails } from "../utils/emailGuesser.js";
import { parseLimit } from "../utils/validation.js";

export async function runAutomation(req, res, next) {
  try {
    const { keyword } = req.body;
    const limit = parseLimit(req.body.limit, 5);

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: "keyword is required"
      });
    }

    const jobs = await scrapeLinkedInJobs(String(keyword), limit);
    const results = [];
    const logEntries = [];

    for (const job of jobs) {
      const guessedEmails = buildRecruiterEmails(job.company);

      for (const email of guessedEmails) {
        const entry = {
          company: job.company,
          jobTitle: job.title,
          email,
          timestamp: new Date().toISOString(),
          status: "pending"
        };

        try {
          const body = await generateColdEmail({
            jobTitle: job.title,
            company: job.company
          });

          await sendColdEmail({
            to: email,
            subject: `Application for ${job.title}`,
            body
          });

          entry.status = "sent";
        } catch (error) {
          entry.status = "failed";
          entry.error = error.message;
        }

        logEntries.push(entry);
        results.push(entry);
      }
    }

    await appendApplicationLogs(logEntries);

    return res.json({
      success: true,
      jobsProcessed: jobs.length,
      emailsSent: results.filter((result) => result.status === "sent").length,
      jobsFound: jobs.length,
      applicationsAttempted: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
}
