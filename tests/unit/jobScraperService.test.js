import { jest } from "@jest/globals";

const mockClose = jest.fn();
const mockNewPage = jest.fn();
const mockLaunch = jest.fn(() => ({
  newPage: mockNewPage,
  close: mockClose
}));

jest.unstable_mockModule("playwright", () => ({
  chromium: {
    launch: mockLaunch
  }
}));

describe("jobScraperService", () => {
  beforeEach(() => {
    jest.resetModules();
    mockClose.mockReset();
    mockNewPage.mockReset();
    mockLaunch.mockClear();
  });

  it("scrapes public LinkedIn job cards", async () => {
    const page = {
      goto: jest.fn(),
      waitForSelector: jest.fn().mockResolvedValue({}),
      $$eval: jest.fn().mockResolvedValue([
        {
          title: "Backend Intern",
          company: "Acme",
          url: "https://www.linkedin.com/jobs/view/1",
          location: "Remote"
        }
      ])
    };
    mockNewPage.mockResolvedValueOnce(page);

    const { scrapeLinkedInJobs } = await import("../../services/jobScraperService.js");
    const jobs = await scrapeLinkedInJobs("backend intern", 3);

    expect(jobs).toEqual([
      {
        title: "Backend Intern",
        company: "Acme",
        url: "https://www.linkedin.com/jobs/view/1",
        location: "Remote"
      }
    ]);
    expect(page.goto).toHaveBeenCalledWith(
      expect.stringContaining("keywords=backend+intern"),
      expect.objectContaining({ waitUntil: "domcontentloaded" })
    );
    expect(page.$$eval).toHaveBeenCalledWith(expect.any(String), expect.any(Function), 3);
    expect(mockClose).toHaveBeenCalled();
  });

  it("returns an empty array when no cards are found", async () => {
    const page = {
      goto: jest.fn(),
      waitForSelector: jest.fn().mockRejectedValue(new Error("timeout")),
      $$eval: jest.fn()
    };
    mockNewPage.mockResolvedValueOnce(page);

    const { scrapeLinkedInJobs } = await import("../../services/jobScraperService.js");
    const jobs = await scrapeLinkedInJobs("backend intern", 3);

    expect(jobs).toEqual([]);
    expect(page.$$eval).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it("closes the browser when scraping fails", async () => {
    const page = {
      goto: jest.fn().mockRejectedValue(new Error("network failed"))
    };
    mockNewPage.mockResolvedValueOnce(page);

    const { scrapeLinkedInJobs } = await import("../../services/jobScraperService.js");

    await expect(scrapeLinkedInJobs("backend intern", 3)).rejects.toThrow("network failed");
    expect(mockClose).toHaveBeenCalled();
  });
});
