import fs from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { requireEnv } from "../config/env.js";

let resend;

function getResendClient() {
  if (!resend) {
    resend = new Resend(requireEnv("RESEND_API_KEY"));
  }

  return resend;
}

function textToHtml(text) {
  const body = String(text).trim();

  if (/^<[a-z][\s\S]*>$/i.test(body)) {
    return body;
  }

  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendColdEmail({ to, subject, body }) {
  const client = getResendClient();
  const resumePath = path.resolve(process.cwd(), "resume.pdf");
  const resume = await fs.readFile(resumePath).catch((error) => {
    if (error.code === "ENOENT") {
      const missingResumeError = new Error("resume.pdf not found in project root");
      missingResumeError.statusCode = 500;
      throw missingResumeError;
    }

    throw error;
  });

  const { data, error } = await client.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Applications <onboarding@resend.dev>",
    to,
    subject,
    html: textToHtml(body),
    attachments: [
      {
        filename: "resume.pdf",
        content: resume.toString("base64")
      }
    ]
  });

  if (error) {
    throw new Error(error.message || "Resend failed to send email");
  }

  return data;
}
