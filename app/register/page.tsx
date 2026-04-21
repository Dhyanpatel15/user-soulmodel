"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    display_name: "",
    email: "",
    password: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.register(form);

      const accessToken = response?.data?.access_token;

      if (accessToken) {
        setToken(accessToken);
        await refreshUser();
        router.replace("/feed");
      } else {
        router.replace("/login");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e8125c] to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Join Soulmodel</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                required
                placeholder="Your full name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="your@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Create a password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#e8125c] hover:bg-[#c4104f] text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-pink-200 mt-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#e8125c] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}