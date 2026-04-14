import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
  variant?: "inline" | "page";
};

export default function ErrorMessage({ message, onRetry, variant = "inline" }: ErrorMessageProps) {
  if (variant === "page") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700 text-sm">Something went wrong</p>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e8125c] text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-[#c4104f] transition-colors"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
      <AlertCircle size={18} className="flex-shrink-0" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#e8125c] hover:underline flex-shrink-0"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}