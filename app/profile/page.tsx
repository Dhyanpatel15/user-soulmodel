"use client";

import { useEffect, useRef, useState } from "react";
import { userProfileApi, mediaUrl } from "@/lib/api";
import { Camera, Save, Loader2 } from "lucide-react";
import Spinner from "@/components/Spinner";

type ProfileForm = {
  display_name: string;
  username: string;
  bio: string;
  email: string;
  avatar: string;
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    display_name: "",
    username: "",
    bio: "",
    email: "",
    avatar: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response: any = await userProfileApi.getMe();
        const data = response?.data || response || {};
        const profile = data?.profile || {};

        const avatarValue =
          profile?.avatar ||
          profile?.avatar_url ||
          data?.avatar ||
          data?.avatar_url ||
          data?.profile_image ||
          "";

        setForm({
          display_name: profile?.display_name || data?.display_name || "",
          username: profile?.username || data?.username || "",
          bio: profile?.bio || data?.bio || "",
          email: data?.email || "",
          avatar: avatarValue,
        });

        setAvatarPreview(avatarValue ? mediaUrl(avatarValue) : "");
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional validation
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError("");
    setSaved(false);
    setAvatarFile(file);

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const payload = {
        display_name: form.display_name,
        username: form.username,
        bio: form.bio,
      };

      let response: any;

      if (avatarFile) {
        response = await userProfileApi.updateMeWithAvatar(payload, avatarFile);
      } else {
        response = await userProfileApi.updateMe(payload);
      }

      const data = response?.data || response || {};
      const profile = data?.profile || {};

      const updatedAvatar =
        profile?.avatar ||
        profile?.avatar_url ||
        data?.avatar ||
        data?.avatar_url ||
        form.avatar;

      setForm((prev) => ({
        ...prev,
        display_name: profile?.display_name || data?.display_name || prev.display_name,
        username: profile?.username || data?.username || prev.username,
        bio: profile?.bio || data?.bio || prev.bio,
        avatar: updatedAvatar || prev.avatar,
      }));

      setAvatarPreview(updatedAvatar ? mediaUrl(updatedAvatar) : avatarPreview);
      setAvatarFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const initials = form.display_name
    ? form.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : form.username
    ? form.username.slice(0, 2).toUpperCase()
    : "?";

  if (loading) return <Spinner text="Loading profile..." />;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
      <p className="text-gray-500 text-sm mb-8">Manage your account details</p>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={form.username || "User avatar"}
                className="w-20 h-20 rounded-full object-cover border-2 border-pink-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}

            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#e8125c] rounded-full flex items-center justify-center border-2 border-white"
            >
              <Camera size={13} className="text-white" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              {form.display_name || form.username || "User"}
            </p>
            <p className="text-sm text-gray-500">
              {form.username ? `@${form.username}` : "No username"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Click the camera icon to upload avatar
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm opacity-70 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Bio
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#e8125c] focus:bg-white transition-all resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-500 text-white"
              : "bg-[#e8125c] hover:bg-[#c4104f] text-white"
          } disabled:opacity-60`}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}