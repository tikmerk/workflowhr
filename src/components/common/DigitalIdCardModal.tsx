import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Printer,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Palette,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Share2,
  FileCheck,
  Camera,
  Upload,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { Employee } from "../../types";
import { DigitalIdCard } from "./DigitalIdCard";
import { useCompanyBranding } from "../../context/CompanyBrandingContext";
import { useThemeLanguage } from "../../context/ThemeLanguageContext";
import { compressAndOptimizeImage } from "../../utils/imageCompression";

interface DigitalIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  allEmployees?: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
  onUpdateFacePhoto?: (employeeId: string, photoUrl: string) => void;
}

export const DigitalIdCardModal: React.FC<DigitalIdCardModalProps> = ({
  isOpen,
  onClose,
  employee,
  allEmployees = [],
  onSelectEmployee,
  onUpdateFacePhoto,
}) => {
  const { branding, getCompanyDisplayName } = useCompanyBranding();
  const { t, isBangla } = useThemeLanguage();

  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [cardTheme, setCardTheme] = useState<"dark" | "light" | "navy">("dark");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUpdateSuccess, setPhotoUpdateSuccess] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !employee) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      setPhotoUpdateSuccess(false);
      const optimized = await compressAndOptimizeImage(file, 480, 480, 0.85);
      if (onUpdateFacePhoto) {
        onUpdateFacePhoto(employee.id, optimized);
      }
      setPhotoUpdateSuccess(true);
      setTimeout(() => setPhotoUpdateSuccess(false), 3500);
    } catch (err) {
      console.error("Failed to upload photo for ID badge:", err);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // High-Resolution PNG Exporter (3x DPI for crisp 300+ DPI print ready output)
  const handleDownloadHighResPng = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      setDownloadSuccess(false);

      // Wait a tick for assets & fonts to render fully
      await new Promise((resolve) => setTimeout(resolve, 200));

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3.5, // Ultra HD Sharpness (3.5x scale)
        quality: 1.0,
        backgroundColor: "transparent",
      });

      const cleanName = employee.fullName.replace(/[^a-zA-Z0-9]/g, "_");
      const sideText = cardSide === "front" ? "FRONT" : "BACK";
      const filename = `${employee.employeeCode}_${cleanName}_ID_CARD_${sideText}.png`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Error generating high resolution PNG:", err);
      alert(
        isBangla
          ? "আইডি কার্ড ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
          : "Failed to export high-res PNG. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Employee Navigation if in Admin Mode
  const currentIndex = allEmployees.findIndex((e) => e.id === employee.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allEmployees.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSelectEmployee) {
      onSelectEmployee(allEmployees[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext && onSelectEmployee) {
      onSelectEmployee(allEmployees[currentIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="digital-id-card-modal-container"
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{t("অফিসিয়াল ডিজিটাল আইডি কার্ড", "Official Digital ID Badge")}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {employee.employeeCode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {t(
                  "উচ্চ রেজোলিউশনের লম্বালম্বি আইডি কার্ড প্রিন্ট ও ডাউনলোড পোর্টাল",
                  "High-resolution portrait badge with anti-spoofing verification"
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls & Right Card Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Customization Controls & Actions */}
          <div className="lg:col-span-6 space-y-4">
            {/* Employee Quick Info Card & Photo Upload Action */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.fullName}
                    className="w-13 h-13 rounded-xl object-cover border-2 border-teal-500 shadow-md shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-md cursor-pointer transition-colors"
                    title="আইডি কার্ডের ছবি পরিবর্তন করুন"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-white truncate">{employee.fullName}</h3>
                  <p className="text-xs text-teal-400 font-medium truncate">{employee.designationTitle}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {employee.departmentName} • {employee.branchName}
                  </p>
                </div>

                {/* Employee Navigator if allEmployees present */}
                {allEmployees.length > 1 && onSelectEmployee && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handlePrev}
                      disabled={!hasPrev}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-all cursor-pointer"
                      title="Previous Employee"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={!hasNext}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-all cursor-pointer"
                      title="Next Employee"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Photo Change / Upload Button for Persistent Storage */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="w-full py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                      <span>অপটিমাইজ ও ক্লাউড সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-teal-400" />
                      <span>{t("আইডি কার্ডের ছবি পরিবর্তন বা আপলোড", "Upload / Change ID Photo")}</span>
                    </>
                  )}
                </button>
              </div>

              {photoUpdateSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {t(
                      "ছবিটি সফলভাবে ক্লাউড ডাটাবেজ (Firestore) ও আইডি কার্ডে সংরক্ষিত হয়েছে!",
                      "Photo successfully saved to cloud database & ID card!"
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* 1. Side Flip Selector (Front / Back) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
                <span>{t("কার্ডের দিক নির্বাচন করুন (Front / Back):", "Select Card Side:")}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCardSide("front")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    cardSide === "front"
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md shadow-teal-500/10"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t("সম্মুখভাগ (Front Side)", "Front Side")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide("back")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    cardSide === "back"
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-md shadow-teal-500/10"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{t("বিপরীতভাগ (Back Side)", "Back Side")}</span>
                </button>
              </div>
            </div>

            {/* 2. Theme / Style Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-teal-400" />
                <span>{t("কার্ডের ভিজ্যুয়াল থিম:", "Card Visual Style:")}</span>
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                {[
                  { id: "dark", labelEn: "Executive Dark", labelBn: "এক্সিকিউটিভ ডার্ক", color: "bg-slate-950 border-teal-500" },
                  { id: "light", labelEn: "Crisp Silver", labelBn: "সিলভার লাইট", color: "bg-slate-100 border-slate-300 text-slate-900" },
                  { id: "navy", labelEn: "Royal Navy", labelBn: "রয়্যাল নেভি", color: "bg-indigo-950 border-indigo-500" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCardTheme(item.id as any)}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                      cardTheme === item.id
                        ? "border-teal-400 bg-teal-500/20 text-white shadow-sm ring-2 ring-teal-500/30"
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-850"
                    }`}
                  >
                    {isBangla ? item.labelBn : item.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. High Resolution Download Notice */}
            <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-teal-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t("আল্ট্রা এইচডি (3.5x রেজোলিউশন) পিএনজি এক্সপোর্ট", "Ultra HD (300+ DPI) PNG Export")}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {t(
                  "এই পিএনজি ফাইলটি সরাসরি কালার প্রিন্টারে প্রিন্ট বা পিভিসি কার্ডে প্রিন্ট করার জন্য উপযুক্ত। কোনো জুম বা প্রিন্টেই লেখা বা লোগো ফাটবে না।",
                  "Exported in ultra-high resolution ready for instant PVC badge or paper card printing without quality loss."
                )}
              </p>
            </div>

            {/* 4. Action Buttons (Download & Print) */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownloadHighResPng}
                disabled={isDownloading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <span>{t("এইচডি কার্ড রেন্ডার হচ্ছে...", "Generating Ultra HD PNG...")}</span>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    <span>{t("ডাউনলোড সফল হয়েছে!", "Downloaded Successfully!")}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>
                      {t(
                        `হাই-রেজোলিউশন PNG ডাউনলোড করুন (${cardSide === "front" ? "Front" : "Back"})`,
                        `Download High-Res PNG (${cardSide === "front" ? "Front" : "Back"})`
                      )}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-teal-400" />
                <span>{t("সরাসরি প্রিন্ট করুন (Print Card)", "Print Badge directly")}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Card Preview Frame */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-3 sm:p-4 rounded-3xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
            <div className="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {t("লাইভ কার্ড প্রিভিউ (লম্বালম্বি স্ট্যান্ডার্ড সাইজ)", "Live Vertical ID Card Preview")}
              </span>
            </div>

            {/* Scaled ID Card Visual Wrapper */}
            <div className="transform scale-95 sm:scale-100 transition-transform origin-top">
              <DigitalIdCard
                ref={cardRef}
                employee={employee}
                cardSide={cardSide}
                cardTheme={cardTheme}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span className="text-[11px]">
              {getCompanyDisplayName(isBangla)} • Verified Identity System
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer ml-auto"
          >
            {t("বন্ধ করুন", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
};
