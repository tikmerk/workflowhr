import React, { createContext, useContext, useState, useEffect } from "react";
import { CompanyBranding } from "../types";
import {
  saveBrandingSettingsToFirestore,
  subscribeToBrandingSettings,
  fetchBrandingSettingsFromFirestore,
} from "../services/firestoreService";

export interface SoftwareBrandingInfo {
  name: string;
  vendor: string;
  vendorUrl: string;
  developerName: string;
  edition: string;
  labelEn: string;
  labelBn: string;
  footerCreditEn: string;
  footerCreditBn: string;
}

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: "Muslim Welfare Organization",
  companyNameBn: "মুসলিম ওয়েলফেয়ার অর্গানাইজেশন",
  tagline: "Social Welfare, Humanitarian Relief & Community Development",
  taglineBn: "সমাজকল্যাণ, মানবিক সহায়তা ও সমাজসেবামূলক সংস্থা",
  logoUrl: "", // When empty, renders the executive corporate monogram
  address: "Gulshan Corporate Avenue, Dhaka-1212, Bangladesh",
  addressBn: "গুলশান করপোরেট এভিনিউ, ঢাকা-১২১২, বাংলাদেশ",
  phone: "+880 2-9887766, +880 1700-112233",
  email: "info@muslimwelfare.org",
  website: "https://muslimwelfare.org",
  registrationNumber: "REG-BD-2026-90812",
  employeeIdPrefix: "MWO",
  salaryDisbursementPolicy: "BOTH",
  employeeDirectoryScope: "OWN_BRANCH_ONLY",
  defaultSignatoryName: "Md. Ibrahim Hossain",
  defaultSignatoryTitle: "Executive Director & Head of Administration",
};

export const SOFTWARE_BRANDING: SoftwareBrandingInfo = {
  name: "WorkFlowHR",
  vendor: "TIKMERK IT",
  vendorUrl: "https://tikmerk.com",
  developerName: "Md. Ibrahim Hossain",
  edition: "Enterprise Edition v3.2",
  labelEn: "WorkFlowHR By TIKMERK IT",
  labelBn: "WorkFlowHR By TIKMERK IT",
  footerCreditEn: "WorkFlowHR Enterprise Edition • Developed by Md. Ibrahim Hossain • Powered by TIKMERK IT (https://tikmerk.com)",
  footerCreditBn: "WorkFlowHR এন্টারপ্রাইজ • ডেভেলপমেন্ট: মোঃ ইব্রাহিম হোসেন • পাওয়ারড বাই: TIKMERK IT",
};

interface CompanyBrandingContextType {
  branding: CompanyBranding;
  updateBranding: (updates: Partial<CompanyBranding>) => void;
  resetBranding: () => void;
  isBrandingModalOpen: boolean;
  setIsBrandingModalOpen: (open: boolean) => void;
  isDemoModeEnabled: boolean;
  setIsDemoModeEnabled: (enabled: boolean) => void;
  softwareBranding: SoftwareBrandingInfo;
  getCompanyDisplayName: (isBangla?: boolean) => string;
  getCompanyTagline: (isBangla?: boolean) => string;
  getCompanyAddress: (isBangla?: boolean) => string;
  getEmployeeIdPrefix: () => string;
}

const CompanyBrandingContext = createContext<CompanyBrandingContextType | undefined>(undefined);

export const CompanyBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBrandingState] = useState<CompanyBranding>(() => {
    try {
      const saved = localStorage.getItem("workflow_hr_client_branding");
      if (saved) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to load branding from localStorage", e);
    }
    return DEFAULT_BRANDING;
  });

  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState<boolean>(false);
  const [isDemoModeEnabled, setIsDemoModeEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("workflow_hr_demo_mode");
      if (saved !== null) {
        return saved === "true";
      }
    } catch (e) {
      console.warn(e);
    }
    return true; // Default ON as requested
  });

  // Sync from Firestore on mount & subscribe to real-time updates
  useEffect(() => {
    fetchBrandingSettingsFromFirestore()
      .then(({ branding: fbBranding, isDemoModeEnabled: fbDemo }) => {
        if (fbBranding) {
          setBrandingState((prev) => ({ ...prev, ...fbBranding }));
        }
        if (fbDemo !== null) {
          setIsDemoModeEnabled(fbDemo);
        }
      })
      .catch((err) => {
        console.warn("Branding fetch fallback:", err);
      });

    const unsubscribe = subscribeToBrandingSettings((fbBranding, fbDemo) => {
      if (fbBranding) {
        setBrandingState((prev) => ({ ...prev, ...fbBranding }));
      }
      if (fbDemo !== undefined && fbDemo !== null) {
        setIsDemoModeEnabled(fbDemo);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("workflow_hr_demo_mode", String(isDemoModeEnabled));
    } catch (e) {
      console.warn(e);
    }
  }, [isDemoModeEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("workflow_hr_client_branding", JSON.stringify(branding));
    } catch (e) {
      console.warn("Failed to persist branding to localStorage", e);
    }
  }, [branding]);

  const updateBranding = (updates: Partial<CompanyBranding>) => {
    setBrandingState((prev) => {
      const next = { ...prev, ...updates };
      saveBrandingSettingsToFirestore(next, isDemoModeEnabled);
      return next;
    });
  };

  const handleSetDemoMode = (enabled: boolean) => {
    setIsDemoModeEnabled(enabled);
    saveBrandingSettingsToFirestore(branding, enabled);
  };

  const resetBranding = () => {
    setBrandingState(DEFAULT_BRANDING);
    saveBrandingSettingsToFirestore(DEFAULT_BRANDING, isDemoModeEnabled);
    try {
      localStorage.removeItem("workflow_hr_client_branding");
    } catch (e) {
      console.warn(e);
    }
  };

  const getCompanyDisplayName = (isBangla: boolean = false) => {
    if (isBangla && branding.companyNameBn?.trim()) {
      return branding.companyNameBn;
    }
    return branding.companyName || DEFAULT_BRANDING.companyName;
  };

  const getCompanyTagline = (isBangla: boolean = false) => {
    if (isBangla && branding.taglineBn?.trim()) {
      return branding.taglineBn;
    }
    return branding.tagline || DEFAULT_BRANDING.tagline;
  };

  const getCompanyAddress = (isBangla: boolean = false) => {
    if (isBangla && branding.addressBn?.trim()) {
      return branding.addressBn;
    }
    return branding.address || DEFAULT_BRANDING.address;
  };

  const getEmployeeIdPrefix = () => {
    return branding.employeeIdPrefix?.trim() || "MWO";
  };

  return (
    <CompanyBrandingContext.Provider
      value={{
        branding,
        updateBranding,
        resetBranding,
        isBrandingModalOpen,
        setIsBrandingModalOpen,
        isDemoModeEnabled,
        setIsDemoModeEnabled: handleSetDemoMode,
        softwareBranding: SOFTWARE_BRANDING,
        getCompanyDisplayName,
        getCompanyTagline,
        getCompanyAddress,
        getEmployeeIdPrefix,
      }}
    >
      {children}
    </CompanyBrandingContext.Provider>
  );
};

export const useCompanyBranding = () => {
  const context = useContext(CompanyBrandingContext);
  if (!context) {
    throw new Error("useCompanyBranding must be used within a CompanyBrandingProvider");
  }
  return context;
};
