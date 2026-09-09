import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "bn" | "en";
export type Theme = "dark" | "light";

interface ThemeLanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  t: (bnText: string, enText: string) => string;
  isBangla: boolean;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language State - Default to Bangla as per user request
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("workflow_hr_lang");
      return (saved === "en" || saved === "bn") ? saved : "bn";
    } catch {
      return "bn";
    }
  });

  // Theme State - Default to dark or saved preference
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("workflow_hr_theme");
      return (saved === "light" || saved === "dark") ? saved : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("workflow_hr_lang", language);
    } catch (e) {
      console.warn("Could not save language to localStorage", e);
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem("workflow_hr_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    } catch (e) {
      console.warn("Could not save theme to localStorage", e);
    }
  }, [theme]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => setLanguageState((prev) => (prev === "bn" ? "en" : "bn"));

  const setTheme = (th: Theme) => setThemeState(th);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const isBangla = language === "bn";

  // Translation helper: t(bnText, enText) returns bnText if language === 'bn' else enText
  const t = (bnText: string, enText: string): string => {
    return language === "bn" ? bnText : enText;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
        t,
        isBangla,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error("useThemeLanguage must be used within a ThemeLanguageProvider");
  }
  return context;
};
