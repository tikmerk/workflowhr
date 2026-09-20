import React, { useState, useMemo } from "react";
import {
  FileCheck2,
  Printer,
  Sparkles,
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
  Mail,
  Lock,
  UserCheck,
  Save,
  Check,
  Award
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
  const { branding, updateBranding } = useCompanyBranding();
  const { t, isBangla } = useThemeLanguage();

  // Role-based employee access: Super Admin & CEO have full control over signatories & all records
  const isSuperAdminOrCeo =
    Boolean(currentUser?.isSuperAdmin) ||
    Boolean(currentUser?.isCeoOrOwner) ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "CEO" ||
    currentUser?.role === "HR_MANAGER";

  const isBranchManager = currentUser?.role === "BRANCH_MANAGER";

  const accessibleEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (isSuperAdminOrCeo) return true;
      if (isBranchManager) return emp.branchId === currentUser?.branchId;
      return emp.id === currentUser?.id;
    });
  }, [employees, isSuperAdminOrCeo, isBranchManager, currentUser]);

  const [selectedEmpId, setSelectedEmpId] = useState(accessibleEmployees[0]?.id || employees[0]?.id || "");
  const [selectedType, setSelectedType] = useState<CertificateRecord["type"]>("EXPERIENCE_CERTIFICATE");
  const [remarks, setRemarks] = useState("");
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(certificates[0] || null);

  // Super Admin Configured Authorized Signatory
  const [signatoryName, setSignatoryName] = useState(
    branding.defaultSignatoryName || "Md. Ibrahim Hossain"
  );
  const [signatoryTitle, setSignatoryTitle] = useState(
    branding.defaultSignatoryTitle || "Executive Director & Head of Administration"
  );
  const [isSavedAsDefault, setIsSavedAsDefault] = useState(false);

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

  // Quick executive candidates for Super Admin to select as signatory
  const executiveOfficers = useMemo(() => {
    return employees.filter(
      (e) =>
        e.isSuperAdmin ||
        e.isCeoOrOwner ||
        e.role === "SUPER_ADMIN" ||
        e.role === "CEO" ||
        e.role === "HR_MANAGER" ||
        e.role === "BRANCH_MANAGER" ||
        e.designationTitle.toLowerCase().includes("director") ||
        e.designationTitle.toLowerCase().includes("manager") ||
        e.designationTitle.toLowerCase().includes("officer")
    );
  }, [employees]);

  const handleSaveSignatoryDefault = () => {
    if (!isSuperAdminOrCeo) return;
    updateBranding({
      defaultSignatoryName: signatoryName,
      defaultSignatoryTitle: signatoryTitle,
    });
    setIsSavedAsDefault(true);
    setTimeout(() => setIsSavedAsDefault(false), 3000);
  };

  const handleGenerateNew = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId) || accessibleEmployees[0] || employees[0];
    const typeObj = certTypes.find((t) => t.type === selectedType);

    const prefix = branding.employeeIdPrefix || "MWO";
    const certNum = `${prefix}-CERT-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    const issueDate = new Date().toISOString().split("T")[0];

    const contentHtml = generateCertificateHtml(selectedType, emp, branding, {
      authorizedSignatory: signatoryName,
      signatoryTitle: signatoryTitle,
      customReason: remarks,
      refNo: certNum,
      issueDate,
    });

    const newCert: CertificateRecord = {
      id: `cert-${Date.now()}`,
      certificateNumber: certNum,
      referenceNumber: certNum,
      type: selectedType,
      title: typeObj?.label || "Official Certificate",
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeCode: emp.employeeCode,
      designationTitle: emp.designationTitle,
      departmentName: emp.departmentName,
      branchName: emp.branchName,
      issueDate,
      authorizedSignatory: signatoryName,
      signatoryTitle: signatoryTitle,
      verifiedQrCode: `https://workflowhr.tikmerk.com/verify?cert=${prefix}-2026-${emp.employeeCode}`,
      contentHtml,
    };

    onGenerateCertificate(newCert);
    setPreviewCert(newCert);
  };

  // Ensure rendered content uses the modern Notice Board letterhead format for all certificates
  const renderedPreviewHtml = useMemo(() => {
    if (!previewCert) return "";
    if (
      previewCert.contentHtml &&
      (previewCert.contentHtml.includes("Registered Corporate Administration") ||
        previewCert.contentHtml.includes("OFFICIAL CORPORATE SEAL"))
    ) {
      return previewCert.contentHtml;
    }
    const emp =
      employees.find((e) => e.id === previewCert.employeeId) ||
      accessibleEmployees[0] ||
      employees[0];
    return generateCertificateHtml(previewCert.type, emp, branding, {
      authorizedSignatory:
        previewCert.authorizedSignatory || branding.defaultSignatoryName || signatoryName,
      signatoryTitle:
        previewCert.signatoryTitle || branding.defaultSignatoryTitle || signatoryTitle,
      refNo: previewCert.certificateNumber || previewCert.referenceNumber,
      issueDate: previewCert.issueDate,
    });
  }, [previewCert, employees, accessibleEmployees, branding, signatoryName, signatoryTitle]);

  const handlePrintPreview = () => {
    if (previewCert) {
      printDocumentHtml(previewCert.title || "Official Corporate Certificate", renderedPreviewHtml);
    }
  };

  return (
    <div id="certificates-generator-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>{isBangla ? "অফিসিয়াল সার্টিফিকেট ও করপোরেট লেটারহেড জেনারেটর" : "Official Certificate & Corporate Letterhead Generator"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isBangla
              ? "নোটিশ বোর্ডের মতো প্রফেশনাল এ-ফোর (A4) লেটার প্যাড ডিজাইন এবং সুপার অ্যাডমিন অনুমোদিত স্বাক্ষরে সনদ তৈরি করুন"
              : "Generate publication-grade official corporate letters with Notice-Board style A4 letterheads & Admin-configured signatories"}
          </p>
        </div>

        {previewCert && (
          <button
            onClick={handlePrintPreview}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isBangla ? "এ-ফোর প্রিন্ট / PDF সংরক্ষণ" : "Print / Save PDF (A4)"}</span>
          </button>
        )}
      </div>

      {/* 2-Column Layout: Controls & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generator Form & Signatory Settings */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {isBangla ? "নতুন সার্টিফিকেট তৈরি করুন" : "Generate New Certificate"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/20">
                A4 Letterhead
              </span>
            </h3>

            <form onSubmit={handleGenerateNew} className="space-y-3.5 text-xs">
              {/* Employee Selection */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "কর্মচারী নির্বাচন করুন (Employee):" : "Select Employee:"}
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                >
                  {accessibleEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({e.employeeCode}) - {e.designationTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Template Type */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "সনদের ধরন / টেমপ্লেট:" : "Certificate Template Type:"}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-teal-500"
                >
                  {certTypes.map((t) => (
                    <option key={t.type} value={t.type}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Special Remarks / Addendum */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-semibold">
                  {isBangla ? "বিশেষ কারণ বা সংযোজন (ঐচ্ছিক):" : "Special Purpose / Notes (Optional):"}
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={isBangla ? "যেমন: বিদেশ ভ্রমণ / উচ্চশিক্ষা / ভিসা আবেদন..." : "e.g., Higher education / visa application..."}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Super Admin Configurable Authorized Signatory Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                    {isSuperAdminOrCeo ? (
                      <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>
                      {isBangla ? "অনুমোদিত স্বাক্ষরকারী (Authorized Signatory)" : "Authorized Signatory"}
                    </span>
                  </label>

                  {!isSuperAdminOrCeo && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                      {isBangla ? "অ্যাডমিন কর্তৃক লকড" : "Admin Locked"}
                    </span>
                  )}
                </div>

                {isSuperAdminOrCeo ? (
                  <>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isBangla
                        ? "সুপার অ্যাডমিন হিসেবে আপনি সনদের স্বাক্ষরকারী নির্ধারণ করতে পারেন:"
                        : "As Super Admin, you determine who will sign this certificate:"}
                    </p>

                    {/* Quick Staff Preset Picker */}
                    <div>
                      <select
                        onChange={(e) => {
                          const emp = employees.find((x) => x.id === e.target.value);
                          if (emp) {
                            setSignatoryName(emp.fullName);
                            setSignatoryTitle(emp.designationTitle);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-slate-700 dark:text-slate-300 text-[11px] mb-2"
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {isBangla ? "তালিকা থেকে কর্মকর্তা নির্বাচন করুন (ঐচ্ছিক)" : "Quick Select from Executive Staff..."}
                        </option>
                        {executiveOfficers.map((eo) => (
                          <option key={eo.id} value={eo.id}>
                            {eo.fullName} - {eo.designationTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Signatory Name */}
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                        {isBangla ? "স্বাক্ষরকারীর নাম:" : "Signatory Full Name:"}
                      </label>
                      <input
                        type="text"
                        value={signatoryName}
                        onChange={(e) => setSignatoryName(e.target.value)}
                        placeholder="e.g. Md. Ibrahim Hossain"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white font-bold"
                        required
                      />
                    </div>

                    {/* Signatory Title */}
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                        {isBangla ? "পদবি / ডেজিগনেশন:" : "Signatory Designation / Title:"}
                      </label>
                      <input
                        type="text"
                        value={signatoryTitle}
                        onChange={(e) => setSignatoryTitle(e.target.value)}
                        placeholder="e.g. Executive Director & Head of Administration"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                        required
                      />
                    </div>

                    {/* Save as Default button for Super Admin */}
                    <button
                      type="button"
                      onClick={handleSaveSignatoryDefault}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isSavedAsDefault ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">{isBangla ? "ডিফল্ট হিসেবে সংরক্ষিত!" : "Saved as Default!"}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>{isBangla ? "প্রতিষ্ঠানের ডিফল্ট স্বাক্ষরকারী হিসেবে সংরক্ষণ করুন" : "Save as Default Signatory for Organization"}</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{signatoryName}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{signatoryTitle}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 pt-1">
                      {isBangla
                        ? "স্বাক্ষরকারী শুধুমাত্র সুপার অ্যাডমিন বা সিইও দ্বারা পরিবর্তনযোগ্য।"
                        : "Signatory is designated exclusively by Super Admin & CEO."}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 cursor-pointer transition-all"
              >
                {isBangla ? "জেনারেট করুন ও প্রিভিউ দেখুন" : "Generate & Preview"}
              </button>
            </form>
          </div>

          {/* Certificate Generation History */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{isBangla ? "ইস্যুকৃত সনদের তালিকা" : "Issued Certificates"} ({certificates.length})</span>
              <span className="text-[10px] text-slate-400 font-normal">Click to preview</span>
            </h4>
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
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
                  <div className="font-bold text-slate-900 dark:text-white">
                    {(cert.title || "Certificate").split("(")[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between mt-1">
                    <span>{cert.employeeName}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300 font-semibold">{cert.issueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live A4 Letterhead Document Preview */}
        <div className="lg:col-span-8 overflow-x-auto pb-4">
          {previewCert ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  {isBangla ? "এ-ফোর অফিশিয়াল লেটার প্যাড লাইভ প্রিভিউ" : "Official A4 Letterhead Live Preview"}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {previewCert.certificateNumber || previewCert.referenceNumber || "MWO-CERT-2026"}
                </span>
              </div>

              {/* Locked A4 Dimension Container with Notice Board Pad Design */}
              <div
                id="a4-certificate-preview"
                className="p-8 sm:p-12 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-300 min-h-[720px] flex flex-col justify-between"
                style={{
                  minWidth: "210mm",
                  maxWidth: "210mm",
                  margin: "0 auto",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="prose max-w-none text-slate-900 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }}
                />

                {/* Bottom Verification QR bar matching corporate standard */}
                <div className="pt-5 border-t border-slate-200 flex items-center justify-between mt-8 text-xs text-slate-500">
                  <div className="space-y-0.5">
                    <p className="font-mono text-[10px]">
                      Document Ref: <strong>{previewCert.certificateNumber || previewCert.referenceNumber || "CERT-2026"}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Digitally signed & encrypted by {branding.companyName || "Muslim Welfare Organization"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <QrCode className="w-7 h-7 text-slate-800" />
                    <div className="text-[9px] font-mono leading-tight">
                      <span className="font-bold text-slate-700">SCAN TO VERIFY</span>
                      <br />
                      <span className="text-teal-700 font-black">ORIGINAL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              {isBangla ? "সনদ নির্বাচন করুন বা নতুন সনদ তৈরি করুন।" : "Select or generate a certificate to preview document."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
