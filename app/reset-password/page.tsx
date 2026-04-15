"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 p-3.5 bg-green-50 border border-green-100 rounded-xl text-sm text-green-600">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#e8125c] hover:bg-[#c4104f] text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-pink-200"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Back to{" "}
          <Link href="/login" className="text-[#e8125c] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}