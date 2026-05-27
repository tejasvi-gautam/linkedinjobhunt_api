import { jest } from "@jest/globals";
import request from "supertest";

const mockScrapeLinkedInJobs = jest.fn();
const mockGenerateColdEmail = jest.fn();
const mockSendColdEmail = jest.fn();
const mockAppendApplicationLogs = jest.fn();

jest.unstable_mockModule("../../services/jobScraperService.js", () => ({
  scrapeLinkedInJobs: mockScrapeLinkedInJobs
}));

jest.unstable_mockModule("../../services/geminiService.js", () => ({
  generateColdEmail: mockGenerateColdEmail
}));

jest.unstable_mockModule("../../services/emailService.js", () => ({
  sendColdEmail: mockSendColdEmail
}));

jest.unstable_mockModule("../../services/logService.js", () => ({
  appendApplicationLogs: mockAppendApplicationLogs
}));

const { createApp } = await import("../../app.js");
const { clearRateLimitBuckets } = await import("../../middleware/rateLimiter.js");

const testLogger = {
  error: jest.fn()
};
const app = createApp({ logger: testLogger });

const jobs = [
  {
    title: "Backend Intern",
    company: "Acme",
    url: "https://www.linkedin.com/jobs/view/1",
    location: "Remote"
  },
  {
    title: "Node.js Intern",
    company: "Beta Labs",
    url: "https://www.linkedin.com/jobs/view/2",
    location: "Bengaluru"
  }
];

beforeEach(() => {
  mockScrapeLinkedInJobs.mockReset();
  mockGenerateColdEmail.mockReset();
  mockSendColdEmail.mockReset();
  mockAppendApplicationLogs.mockReset();
  clearRateLimitBuckets();
});

describe("GET /health", () => {
  it("returns API status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "API running"
    });
  });
});

describe("GET /jobs/scrape", () => {
  it("returns scraped jobs with the required shape", async () => {
    mockScrapeLinkedInJobs.mockResolvedValueOnce(jobs);

    const res = await request(app).get("/jobs/scrape?keyword=backend+intern&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs).toHaveLength(2);
    expect(res.body.jobs[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        company: expect.any(String),
        url: expect.any(String),
        location: expect.any(String)
      })
    );
    expect(mockScrapeLinkedInJobs).toHaveBeenCalledWith("backend intern", 3);
  });

  it("handles invalid keyword", async () => {
    const res = await request(app).get("/jobs/scrape?limit=3");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "keyword query parameter is required"
    });
  });

  it("handles scraping failure gracefully", async () => {
    mockScrapeLinkedInJobs.mockRejectedValueOnce(new Error("LinkedIn unavailable"));

    const res = await request(app).get("/jobs/scrape?keyword=backend&limit=3");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: "LinkedIn unavailable"
    });
  });
});

describe("POST /email/generate", () => {
  it("returns a generated email under 150 words", async () => {
    mockGenerateColdEmail.mockResolvedValueOnce(
      "Hello Acme team, I am interested in the Backend Intern role. My robotics and backend work includes ROS2 drones, trading automation, Python, C++, and Node.js. I would be grateful to be considered."
    );

    const res = await request(app).post("/email/generate").send({
      jobTitle: "Backend Intern",
      company: "Acme"
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.email).toEqual(expect.any(String));
    expect(res.body.email.split(/\s+/).length).toBeLessThan(150);
  });

  it("handles missing fields", async () => {
    const res = await request(app).post("/email/generate").send({
      jobTitle: "Backend Intern"
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "jobTitle and company are required"
    });
  });

  it("handles Gemini API failure", async () => {
    mockGenerateColdEmail.mockRejectedValueOnce(new Error("Gemini API failed"));

    const res = await request(app).post("/email/generate").send({
      jobTitle: "Backend Intern",
      company: "Acme"
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: "Gemini API failed"
    });
  });
});

describe("POST /email/send", () => {
  it("sends email successfully and returns success JSON", async () => {
    mockSendColdEmail.mockResolvedValueOnce({ id: "email_123" });

    const res = await request(app).post("/email/send").send({
      to: "delivered@resend.dev",
      subject: "Test",
      body: "<p>Hello</p>"
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Email sent",
      data: { id: "email_123" }
    });
    expect(mockSendColdEmail).toHaveBeenCalledWith({
      to: "delivered@resend.dev",
      subject: "Test",
      body: "<p>Hello</p>"
    });
  });

  it("handles invalid email", async () => {
    const res = await request(app).post("/email/send").send({
      to: "invalid-email",
      subject: "Test",
      body: "<p>Hello</p>"
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "to must be a valid email address"
    });
  });

  it("handles missing resume.pdf", async () => {
    mockSendColdEmail.mockRejectedValueOnce(new Error("resume.pdf not found in project root"));

    const res = await request(app).post("/email/send").send({
      to: "delivered@resend.dev",
      subject: "Test",
      body: "<p>Hello</p>"
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: "resume.pdf not found in project root"
    });
  });
});

describe("POST /automation/run", () => {
  it("runs full workflow and writes logs", async () => {
    mockScrapeLinkedInJobs.mockResolvedValueOnce(jobs);
    mockGenerateColdEmail.mockResolvedValue("Generated email body");
    mockSendColdEmail.mockResolvedValue({ id: "sent" });
    mockAppendApplicationLogs.mockResolvedValue([]);

    const res = await request(app).post("/automation/run").send({
      keyword: "backend intern",
      limit: 2
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobsProcessed).toBe(2);
    expect(res.body.emailsSent).toBe(4);
    expect(res.body.results).toHaveLength(4);
    expect(mockScrapeLinkedInJobs).toHaveBeenCalledWith("backend intern", 2);
    expect(mockGenerateColdEmail).toHaveBeenCalledTimes(4);
    expect(mockSendColdEmail).toHaveBeenCalledTimes(4);
    expect(mockAppendApplicationLogs).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          company: "Acme",
          jobTitle: "Backend Intern",
          status: "sent"
        })
      ])
    );
  });

  it("continues if one email fails", async () => {
    mockScrapeLinkedInJobs.mockResolvedValueOnce([jobs[0]]);
    mockGenerateColdEmail.mockResolvedValue("Generated email body");
    mockSendColdEmail
      .mockRejectedValueOnce(new Error("Resend failed"))
      .mockResolvedValueOnce({ id: "sent" });
    mockAppendApplicationLogs.mockResolvedValue([]);

    const res = await request(app).post("/automation/run").send({
      keyword: "backend intern",
      limit: 2
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobsProcessed).toBe(1);
    expect(res.body.emailsSent).toBe(1);
    expect(res.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "failed", error: "Resend failed" }),
        expect.objectContaining({ status: "sent" })
      ])
    );
  });

  it("handles missing keyword", async () => {
    const res = await request(app).post("/automation/run").send({ limit: 2 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "keyword is required"
    });
  });
});

describe("request validation edge cases", () => {
  it("handles malformed JSON bodies", async () => {
    const res = await request(app)
      .post("/email/generate")
      .set("Content-Type", "application/json")
      .send('{"jobTitle": "Backend Intern"');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Malformed JSON body"
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    const limitedApp = createApp({
      logger: testLogger,
      rateLimit: {
        windowMs: 60000,
        maxRequests: 2
      }
    });

    await request(limitedApp).get("/health").expect(200);
    await request(limitedApp).get("/health").expect(200);
    const res = await request(limitedApp).get("/health");

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Too many requests"
    });
  });
});
