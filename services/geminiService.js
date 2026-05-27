import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireEnv } from "../config/env.js";

let model;

function getGeminiModel() {
  if (!model) {
    const genAI = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
    });
  }

  return model;
}

export async function generateColdEmail({ jobTitle, company }) {
  const gemini = getGeminiModel();

  const prompt = [
    "Write a concise, professional cold email under 150 words.",
    "Return only the email body. Do not include placeholders.",
    "",
    `Job title: ${jobTitle}`,
    `Company: ${company}`,
    "",
    "Candidate profile:",
    "- Robotics developer",
    "- Backend developer",
    "- Built a ROS2 drone project",
    "- Built a crypto trading bot",
    "- Skills: Python, C++, Node.js",
    "",
    "Write a polite cold email asking to be considered for the role."
  ].join("\n");

  const result = await gemini.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 220
    }
  });

  const email = result.response.text().trim();

  if (!email) {
    throw new Error("Gemini returned an empty email");
  }

  return email;
}
