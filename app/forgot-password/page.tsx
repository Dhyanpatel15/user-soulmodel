"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authApi.forgotPassword(email);
      setMessage("Password reset link has been sent to your email.");
      setEmail("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
            <Mail className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email to receive reset instructions
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

        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#e8125c] hover:bg-[#c4104f] text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-pink-200"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Sending..." : "Send Reset Link"}
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