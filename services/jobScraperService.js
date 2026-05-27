import { chromium } from "playwright";

const LINKEDIN_JOBS_URL = "https://www.linkedin.com/jobs/search";

export async function scrapeLinkedInJobs(keyword, limit = 5) {
  const browser = await chromium.launch({
    headless: true
  });

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    });

    const url = new URL(LINKEDIN_JOBS_URL);
    url.searchParams.set("keywords", keyword);
    url.searchParams.set("trk", "public_jobs_jobs-search-bar_search-submit");

    await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    const jobCardsSelector = ".jobs-search__results-list li, .base-card";
    const hasJobCards = await page
      .waitForSelector(jobCardsSelector, {
        timeout: 15000
      })
      .then(() => true)
      .catch(() => false);

    if (!hasJobCards) {
      return [];
    }

    const jobs = await page.$$eval(
      jobCardsSelector,
      (cards, maxJobs) => {
        return cards
          .map((card) => {
            const title =
              card.querySelector(".base-search-card__title")?.textContent?.trim() ||
              card.querySelector("h3")?.textContent?.trim() ||
              "";
            const company =
              card.querySelector(".base-search-card__subtitle")?.textContent?.trim() ||
              card.querySelector("h4")?.textContent?.trim() ||
              "";
            const location =
              card.querySelector(".job-search-card__location")?.textContent?.trim() ||
              "";
            const rawUrl =
              card.querySelector("a.base-card__full-link")?.href ||
              card.querySelector("a")?.href ||
              "";
            const cleanUrl = rawUrl.split("?")[0];

            return {
              title,
              company,
              url: cleanUrl,
              location
            };
          })
          .filter((job) => job.title && job.company && job.url)
          .slice(0, maxJobs);
      },
      limit
    );

    return jobs;
  } finally {
    await browser.close();
  }
}
