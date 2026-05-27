import { jest } from "@jest/globals";

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent
}));
const mockGoogleGenerativeAI = jest.fn(() => ({
  getGenerativeModel: mockGetGenerativeModel
}));

jest.unstable_mockModule("@google/generative-ai", () => ({
  GoogleGenerativeAI: mockGoogleGenerativeAI
}));

describe("geminiService", () => {
  beforeEach(() => {
    jest.resetModules();
    mockGenerateContent.mockReset();
    mockGetGenerativeModel.mockClear();
    mockGoogleGenerativeAI.mockClear();
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_MODEL = "gemini-1.5-flash";
  });

  it("generates a cold email with Gemini", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "Hello Acme team, I am interested in the role."
      }
    });

    const { generateColdEmail } = await import("../../services/geminiService.js");
    const email = await generateColdEmail({
      jobTitle: "Backend Intern",
      company: "Acme"
    });

    expect(email).toBe("Hello Acme team, I am interested in the role.");
    expect(mockGoogleGenerativeAI).toHaveBeenCalledWith("test-gemini-key");
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-1.5-flash"
    });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.any(Array),
        generationConfig: expect.objectContaining({
          maxOutputTokens: 220
        })
      })
    );
  });

  it("throws when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const { generateColdEmail } = await import("../../services/geminiService.js");

    await expect(
      generateColdEmail({
        jobTitle: "Backend Intern",
        company: "Acme"
      })
    ).rejects.toThrow("GEMINI_API_KEY is not configured");
  });

  it("throws when Gemini returns an empty response", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => ""
      }
    });

    const { generateColdEmail } = await import("../../services/geminiService.js");

    await expect(
      generateColdEmail({
        jobTitle: "Backend Intern",
        company: "Acme"
      })
    ).rejects.toThrow("Gemini returned an empty email");
  });
});
