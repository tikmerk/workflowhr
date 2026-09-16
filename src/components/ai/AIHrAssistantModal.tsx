import React, { useState } from "react";
import {
  X,
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  FileCheck,
  Building2,
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Zap
} from "lucide-react";
import { Branch } from "../../types";

interface AIHrAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBranch?: Branch;
  allBranches?: Branch[];
  branches?: Branch[];
  companyContext?: {
    totalStaff?: number;
    branches?: string[];
    departments?: string[];
    openJobVacancies?: number;
  };
}

const DEFAULT_FALLBACK_BRANCH: Branch = {
  id: "branch-dhaka",
  companyId: "comp-01",
  name: "Dhaka Principal Campus (HQ)",
  code: "DHK-HQ",
  isHeadOffice: true,
  address: "Gulshan-2 Corporate Avenue, Dhaka",
  city: "Dhaka",
  state: "Dhaka Division",
  country: "Bangladesh",
  phone: "+880 1700-112233",
  email: "dhaka.hq@muslimwelfare.org",
  latitude: 23.7925,
  longitude: 90.4078,
  geofenceRadiusMeters: 150,
  wifiSSIDWhitelist: ["MWO_CORP_5G", "MWO_GUEST_SECURE"],
  totalEmployees: 48,
  activeStatus: "ACTIVE",
};

interface ChatEntry {
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  insights?: any;
}

export const AIHrAssistantModal: React.FC<AIHrAssistantModalProps> = ({
  isOpen,
  onClose,
  selectedBranch,
  allBranches = [],
  branches = [],
  companyContext,
}) => {
  const branchList = allBranches.length > 0 ? allBranches : branches;
  const activeBranch = selectedBranch || branchList[0] || DEFAULT_FALLBACK_BRANCH;
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      sender: "assistant",
      text: `Hello! I am your **Workflow AI HR & Workforce Intelligence Advisor** (Powered by Gemini AI). I can assist you with:
• **Workforce Punctuality & Attendance Pattern Insights**
• **Automated Payroll & Deduction Calculation Logic**
• **Leave Approvals & Labor Law Compliance**
• **ATS Candidate Screening & Performance Forecasting**

How may I assist your organization today?`,
      timestamp: "Just now",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Analyze today's workforce attendance patterns & punctuality",
    "Explain late attendance salary deduction rule",
    "How does geofencing radius validation work across branches?",
    "Summarize leave policy: Casual, Sick & Maternity",
  ];

  const handleSendMessage = async (promptToSend?: string) => {
    const text = promptToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatEntry = {
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInputText("");
    setLoading(true);

    try {
      if (text.toLowerCase().includes("attendance pattern") || text.toLowerCase().includes("analyze today")) {
        // Call Attendance Analysis API
        const response = await fetch("/api/ai/attendance-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            month: "August 2026",
            totalEmployees: 119,
            lateCount: 8,
            absentCount: 3,
            branchStats: branchList.map((b) => ({ name: b.name, employees: b.totalEmployees })),
          }),
        });

        const data = await response.json();
        const insights = data.insights || data.fallback;

        const aiMsg: ChatEntry = {
          sender: "assistant",
          text: `### 📊 AI Attendance & Workforce Analytics Insight
**Punctuality Rate:** **${insights?.punctualityRate || 94.2}%**
${insights?.executiveSummary || "Workforce punctuality remains high across all branches."}

#### 🔍 Detected Trends & Observations:
${(insights?.detectedPatterns || [
  "Average check-in peaks at 09:08 AM within the 15-minute grace period.",
  "Chittagong branch achieved 98.2% on-time check-in today.",
  "Field operations team has 2 late arrivals due to morning traffic corridors."
])
  .map((p: string) => `• ${p}`)
  .join("\n")}

#### 💡 Strategic Recommendations:
${(insights?.recommendedActions || [
  "Maintain current 15-minute grace window for high-traffic branches.",
  "Enforce 1-day deduction on 3 unexcused late attendances.",
  "Recognize Top Punctual Team with Monthly Badge."
])
  .map((r: string) => `• ${r}`)
  .join("\n")}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          insights,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Standard HR Chatbot Query
        const response = await fetch("/api/ai/hr-chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            context: {
              activeBranch: activeBranch.name,
              geofenceRadius: activeBranch.geofenceRadiusMeters,
              totalBranches: branchList.length,
              companyContext,
            },
          }),
        });

        const data = await response.json();
        const reply = data.reply || "I am ready to help you manage your Multi-Branch HR workflows effectively.";

        const aiMsg: ChatEntry = {
          sender: "assistant",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Workflow HR system operates with strict enterprise rules. For attendance, employees must be within the geofenced radius and pass live anti-spoofing face verification. For payroll, late arrivals exceeding 3 occurrences per month trigger 1-day basic pay deduction.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="ai-hr-assistant-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl h-[650px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-teal-500/20 to-blue-500/20 border border-teal-500/30 text-teal-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Workflow AI HR Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" /> Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise Policy, Labor Laws, ATS Screening & Workforce Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Quick Prompts:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full border border-slate-700 whitespace-nowrap text-[11px] transition-all"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Chat Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-tr-none shadow"
                    : "bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                <div>{msg.text}</div>
                <div
                  className={`text-[10px] mt-1.5 font-mono ${
                    msg.sender === "user" ? "text-teal-200 text-right" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                <span>Workflow AI is processing your workforce query...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask anything about HR policy, Geofencing, Payroll, or Employee queries..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            className="p-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
