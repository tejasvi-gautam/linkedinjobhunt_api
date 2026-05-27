import express from "express";

import healthRoutes from "./routes/healthRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import { createRateLimiter } from "./middleware/rateLimiter.js";

export function createApp(options = {}) {
  const app = express();
  const logger = options.logger || console;
  const rateLimit =
    options.rateLimit ||
    (process.env.ENABLE_RATE_LIMIT === "true"
      ? {
          windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
          maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60
        }
      : null);

  app.use(express.json({ limit: "1mb" }));

  if (rateLimit) {
    app.use(createRateLimiter(rateLimit));
  }

  app.use("/health", healthRoutes);
  app.use("/jobs", jobRoutes);
  app.use("/email", emailRoutes);
  app.use("/automation", automationRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found"
    });
  });

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({
        success: false,
        message: "Malformed JSON body"
      });
    }

    logger.error(err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  });

  return app;
}

export default createApp;
