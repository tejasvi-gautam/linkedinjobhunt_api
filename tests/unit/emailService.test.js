import { jest } from "@jest/globals";

const mockSend = jest.fn();
const mockResend = jest.fn(() => ({
  emails: {
    send: mockSend
  }
}));
const mockReadFile = jest.fn();

jest.unstable_mockModule("resend", () => ({
  Resend: mockResend
}));

jest.unstable_mockModule("node:fs/promises", () => ({
  default: {
    readFile: mockReadFile
  },
  readFile: mockReadFile
}));

describe("emailService", () => {
  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    mockResend.mockClear();
    mockReadFile.mockReset();
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.RESEND_FROM_EMAIL = "Tester <test@example.com>";
  });

  it("sends an email with resume.pdf attached", async () => {
    mockReadFile.mockResolvedValueOnce(Buffer.from("pdf"));
    mockSend.mockResolvedValueOnce({
      data: { id: "email_123" },
      error: null
    });

    const { sendColdEmail } = await import("../../services/emailService.js");
    const result = await sendColdEmail({
      to: "delivered@resend.dev",
      subject: "Test",
      body: "<p>Hello</p>"
    });

    expect(result).toEqual({ id: "email_123" });
    expect(mockResend).toHaveBeenCalledWith("test-resend-key");
    expect(mockReadFile).toHaveBeenCalledWith(expect.stringContaining("resume.pdf"));
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Tester <test@example.com>",
        to: "delivered@resend.dev",
        subject: "Test",
        html: "<p>Hello</p>",
        attachments: [
          {
            filename: "resume.pdf",
            content: Buffer.from("pdf").toString("base64")
          }
        ]
      })
    );
  });

  it("escapes plain text bodies into safe HTML", async () => {
    mockReadFile.mockResolvedValueOnce(Buffer.from("pdf"));
    mockSend.mockResolvedValueOnce({
      data: { id: "email_123" },
      error: null
    });

    const { sendColdEmail } = await import("../../services/emailService.js");
    await sendColdEmail({
      to: "delivered@resend.dev",
      subject: "Test",
      body: "Hello <script>"
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: "<p>Hello &lt;script&gt;</p>"
      })
    );
  });

  it("throws when Resend returns an error", async () => {
    mockReadFile.mockResolvedValueOnce(Buffer.from("pdf"));
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid recipient" }
    });

    const { sendColdEmail } = await import("../../services/emailService.js");

    await expect(
      sendColdEmail({
        to: "bad@example.com",
        subject: "Test",
        body: "Hello"
      })
    ).rejects.toThrow("Invalid recipient");
  });

  it("throws when resume.pdf is missing", async () => {
    const notFound = new Error("missing");
    notFound.code = "ENOENT";
    mockReadFile.mockRejectedValueOnce(notFound);

    const { sendColdEmail } = await import("../../services/emailService.js");

    await expect(
      sendColdEmail({
        to: "delivered@resend.dev",
        subject: "Test",
        body: "Hello"
      })
    ).rejects.toThrow("resume.pdf not found in project root");
  });
});
