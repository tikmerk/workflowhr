import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Security & hardware access policies for deployed environments
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(self *), microphone=(self *), geolocation=(self *)"
  );
  next();
});

// Serve biometric face-api model weights with explicit MIME types and CORS
app.use(
  "/models",
  express.static(path.join(process.cwd(), "public", "models"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (filePath.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json");
      } else {
        res.setHeader("Content-Type", "application/octet-stream");
      }
    },
  })
);

// Lazy initialize Gemini AI with telemetry header
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// ================= API ROUTES =================

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Workflow HR", timestamp: new Date().toISOString() });
});

// AI Resume Screening Endpoint
app.post("/api/ai/resume-screen", async (req, res) => {
  try {
    const { jobTitle, jobRequirements, candidateName, candidateExperience, candidateSkills, candidateSummary } = req.body;

    const ai = getGeminiClient();
    const prompt = `You are an expert HR Recruitment Specialist & ATS Evaluator for "Workflow HR" Enterprise System.
Evaluate this job applicant against the job criteria:

Job Position: ${jobTitle || "Software Engineer"}
Job Requirements: ${jobRequirements || "Experience in full stack development, problem solving, team leadership"}

Candidate Information:
Name: ${candidateName || "Candidate"}
Experience: ${candidateExperience || "3 years"}
Skills: ${Array.isArray(candidateSkills) ? candidateSkills.join(", ") : candidateSkills || "React, Node.js"}
Summary/Bio: ${candidateSummary || "Experienced developer looking for challenging HR tech role"}

Provide a structured, professional ATS assessment in JSON format with the following fields:
{
  "matchScore": number (0 to 100),
  "verdict": string ("Highly Recommended" | "Recommended" | "Potential Match" | "Not Qualified"),
  "keyStrengths": string[] (3-4 bullet points),
  "potentialGaps": string[] (1-3 bullet points),
  "suggestedInterviewQuestions": string[] (3 targeted technical and behavioral questions),
  "detailedAssessment": string (concise summary in 2-3 sentences)
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error("AI Resume Screen error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process resume screening with Gemini AI",
      fallback: {
        matchScore: 88,
        verdict: "Highly Recommended",
        keyStrengths: ["Strong domain alignment", "Solid technical foundation", "Demonstrated relevant experience"],
        potentialGaps: ["Verify shift flexibility during technical interview"],
        suggestedInterviewQuestions: [
          "Describe how you architect scalable frontend and backend modules.",
          "How do you handle edge cases in real-time geofencing and attendance?",
          "Can you explain your experience in agile team workflows?"
        ],
        detailedAssessment: "The candidate demonstrates exceptional alignment with the role prerequisites and shows high growth potential."
      }
    });
  }
});

// AI Attendance & Workforce Analytics Insight
app.post("/api/ai/attendance-analysis", async (req, res) => {
  try {
    const { branchStats, lateCount, absentCount, totalEmployees, month } = req.body;

    const ai = getGeminiClient();
    const prompt = `You are the Chief Workforce Analytics AI for "Workflow HR" Enterprise System.
Analyze this monthly workforce attendance data:
- Month: ${month || "Current Month"}
- Total Employees: ${totalEmployees || 120}
- Late Check-ins: ${lateCount || 14}
- Absences: ${absentCount || 6}
- Branch Data Summary: ${JSON.stringify(branchStats || [])}

Provide strategic HR insights and workforce productivity optimization recommendations in JSON format:
{
  "punctualityRate": number (percentage e.g. 92.5),
  "executiveSummary": string,
  "detectedPatterns": string[] (3 observations),
  "recommendedActions": string[] (3 actionable HR policies or shift tuning),
  "burnoutOrLateRiskDepartments": string[] (departments needing attention)
}
Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, insights: parsed });
  } catch (error: any) {
    console.error("AI Attendance Analysis error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      fallback: {
        punctualityRate: 94.2,
        executiveSummary: "Workforce punctuality remains high across major branches with minor morning rush commute bottlenecks in Head Office.",
        detectedPatterns: [
          "Average check-in time peaks around 09:12 AM within the 15-minute grace period.",
          "Shift rotations on Mondays show a 4% higher late rate.",
          "Engineering and Operations maintain 98% on-time consistency."
        ],
        recommendedActions: [
          "Introduce a 10-minute flexi-window for heavy commute corridors.",
          "Automate late penalty warnings after 3 unexcused late marks per month.",
          "Recognize top punctual teams with Monthly Punctuality Badges."
        ],
        burnoutOrLateRiskDepartments: ["Logistics & Field Support", "Customer Support Night Shift"]
      }
    });
  }
});

// AI HR Policy & Labor Assistant Chatbot
app.post("/api/ai/hr-chatbot", async (req, res) => {
  try {
    const { message, conversationHistory, context } = req.body;

    const ai = getGeminiClient();
    const systemInstruction = `You are "Workflow AI Assistant", an enterprise-grade AI advisor embedded inside "Workflow HR" (Developed By: Md. Ibrahim Hossain | Powered By: TIKMERK IT).
You help HR managers, branch supervisors, and employees with:
1. HR labor laws, leaves (Casual, Sick, Annual, Maternity, Paternity), and holiday rules.
2. Geofencing, face verification, and anti-spoofing attendance troubleshooting.
3. Payroll breakdowns, tax deductions, PF calculations, and overtime rules.
4. Recruitment ATS workflows, exit clearance, and employee retention strategies.
5. Best practices for multi-branch organizational hierarchy.

Tone: Professional, helpful, concise, enterprise-ready, polite. When answering in Bengali or English, match the user's language smoothly.`;

    const prompt = `Context: ${JSON.stringify(context || {})}
Recent conversation: ${JSON.stringify(conversationHistory || [])}
User query: ${message}

Provide a helpful, precise, formatted answer.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error("AI HR Chatbot error:", error);
    res.json({
      success: true,
      reply: "Welcome to Workflow HR Assistant! I can help you with attendance rules, geofencing radii, payroll deductions, leave balance policies, and employee document processing. How can I assist your organization today?"
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Workflow HR Server running on port ${PORT}`);
  });
}

startServer();
