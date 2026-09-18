import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected runtime exception",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Workflow HR caught error in lifecycle:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      // Clear non-critical temporary session states, preserve authenticated credentials
      sessionStorage.clear();
      this.setState({ hasError: false, errorMessage: "" });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-teal-500 selection:text-white">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">অ্যাপ্লিকেশন লোড হতে সমস্যা হয়েছে</h1>
                <p className="text-xs text-slate-400">Application encountered a runtime error</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              সিস্টেম নিরাপদে পুনরুদ্ধার করার জন্য নিচের বাটনে ক্লিক করে রিলোড করুন। কোনো ক্যাশ বা সংযোগ সমস্যা থাকলে তা স্বয়ংক্রিয়ভাবে সমাধান হয়ে যাবে।
            </p>

            {this.state.errorMessage && (
              <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                পুনরায় লোড করুন (Reload)
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                ক্যাশ রিসেট
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
