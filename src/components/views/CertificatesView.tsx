import React, { useState } from "react";
import {
  FileCheck2,
  Printer,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Building2,
  Calendar,
  FileText,
  X,
  QrCode,
  ShieldCheck,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { CertificateRecord, Employee, Branch } from "../../types";
import { generateCertificateHtml } from "../../utils/certificateTemplates";
import { printDocumentHtml } from "../../utils/exportUtils";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";

interface CertificatesViewProps {
  certificates: CertificateRecord[];
  employees: Employee[];
  branches: Branch[];
  currentUser?: Employee;
  onGenerateCertificate: (cert: CertificateRecord) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  employees,
  branches,
  currentUser,
  onGenerateCertificate,
}) => {
  const { branding } = useCompanyBranding();
  const { t, isBangla } = useThemeLanguage();

  // Role-based employee access: Branch Managers see their branch employees, general employees see self
  const isSuperAdminOrCeo =
    Boolean(currentUser?.isSuperAdmin) ||
    Boolean(currentUser?.isCeoOrOwner) ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "CEO" ||
    currentUser?.role === "HR_MANAGER";

  const isBranchManager = currentUser?.role === "BRANCH_MANAGER";

  const accessibleEmployees = employees.filter((emp) => {
    if (isSuperAdminOrCeo) return true;
    if (isBranchManager) return emp.branchId === currentUser?.branchId;
    return emp.id === currentUser?.id;
  });

  const [selectedEmpId, setSelectedEmpId] = useState(accessibleEmployees[0]?.id || employees[0]?.id || "");
  const [selectedType, setSelectedType] = useState<CertificateRecord["type"]>("EXPERIENCE_CERTIFICATE");
  const [remarks, setRemarks] = useState("");
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(certificates[0] || null);

  const certTypes: Array<{ type: CertificateRecord["type"]; label: string }> = [
    { type: "EXPERIENCE_CERTIFICATE", label: "Experience Certificate (অভিজ্ঞতা সনদ)" },
    { type: "SALARY_CERTIFICATE", label: "Salary Certificate (বেতন সনদ)" },
    { type: "APPOINTMENT_LETTER", label: "Official Appointment Letter (নিয়োগপত্র)" },
    { type: "NOC_LETTER", label: "No Objection Certificate - NOC" },
    { type: "RELEASE_LETTER", label: "Release & Clearance Letter (ছাড়পত্র)" },
    { type: "INCREMENT_LETTER", label: "Salary Increment Letter (বেতন বৃদ্ধি)" },
    { type: "INTERNSHIP_COMPLETION", label: "Internship Completion Letter" },
    { type: "WARNING_LETTER", label: "Official HR Warning Letter" },
    { type: "RECOMMENDATION_LETTER", label: "Letter of Recommendation" },
  ];

  const handleGenerateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId) || accessibleEmployees[0] || employees[0];
    const typeObj = certTypes.find((t) => t.type === selectedType);

    const prefix = branding.employeeIdPrefix || "MWO";
    const newCert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      certificateNumber: `${prefix}-CERT-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      type: selectedType,
      title: typeObj?.label || "Official Certificate",
      employeeId: emp.id,
      employeeName: emp.fullName,
      issueDate: new Date().toISOString().split("T")[0],
      verifiedQrCode: `https://workflowhr.tikmerk.com/verify?cert=${prefix}-2026-${emp.employeeCode}`,
      contentHtml: generateCertificateHtml(selectedType, emp, branding),
    };

    onGenerateCertificate(newCert);
    setPreviewCert(newCert);
  };

  const handlePrintPreview = () => {
    if (previewCert) {
      printDocumentHtml(previewCert.title, previewCert.contentHtml);
    }
  };

  const companyName = isBangla ? (branding.companyNameBn || branding.companyName) : branding.companyName;
  const companyTagline = isBangla ? (branding.taglineBn || branding.tagline) : branding.tagline;
  const companyAddress = isBangla ? (branding.addressBn || branding.address) : branding.address;

  return (
    <div id="certificates-generator-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Official Corporate Certificate & Letter Generator</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate 9+ government-compliant corporate letters, experience certificates, NOCs & appointment letters
          </p>
        </div>

        {previewCert && (
          <button
            onClick={handlePrintPreview}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        )}
      </div>

      {/* 2-Column Split: Generation Controls (4 cols) & Live Document Preview (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generator Form */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Generate New Certificate
            </h3>

            <form onSubmit={handleGenerateNew} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  {t("কর্মচারী নির্বাচন করুন (Employee)", "Select Employee")}
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  {accessibleEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode}) - {e.designationTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Document Template Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                >
                  {certTypes.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Special Remarks / Note</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional custom addendum notes..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Generate & Preview
              </button>
            </form>
          </div>

          {/* Certificate Generation History */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Issued Certificates ({certificates.length})</h4>
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => setPreviewCert(cert)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    previewCert?.id === cert.id
                      ? "bg-teal-500/10 border-teal-500/50"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-white">{(cert.title || "Certificate").split("(")[0]}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between mt-1">
                    <span>{cert.employeeName}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300">{cert.issueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Document Preview with locked A4 width & horizontal scrolling for mobile */}
        <div className="lg:col-span-8 overflow-x-auto">
          {previewCert ? (
            <div
              className="p-8 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-300 min-h-[600px] flex flex-col justify-between"
              style={{ minWidth: "100%", maxWidth: "210mm", margin: "0 auto", boxSizing: "border-box" }}
            >
              <div
                className="prose max-w-none text-slate-900 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: previewCert.contentHtml }}
              />

              {/* Document Footer with Verification QR */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between mt-8 text-xs text-slate-500">
                <div className="space-y-1">
                  <p className="font-mono text-[10px]">
                    Certificate No: <strong>{previewCert.certificateNumber}</strong>
                  </p>
                  <p className="text-[10px]">
                    Digitally signed & encrypted by {branding.companyName || "Muslim Welfare Organization"}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <QrCode className="w-8 h-8 text-slate-800" />
                  <div className="text-[9px] font-mono leading-tight">
                    <span>SCAN TO VERIFY</span>
                    <br />
                    <span className="text-teal-700">ORIGINAL</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              Select or generate a certificate to preview document.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
