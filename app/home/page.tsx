"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscriptionsApi, mediaUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import { BadgeCheck, Users, TrendingUp, Bookmark } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    subscriptionsApi.getMySubscriptions()
      .then((data) => setSubscriptions(Array.isArray(data) ? data : data?.items || data?.results || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Home</h1>
      <p className="text-gray-500 text-sm mb-8">
        Welcome back, {user?.full_name || user?.username} 👋
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Subscriptions", value: subscriptions.length, icon: Users },
          { label: "Following", value: subscriptions.length, icon: TrendingUp },
          { label: "Bookmarks", value: "–", icon: Bookmark },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-[#e8125c]">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Subscriptions */}
      <div className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Your Subscriptions</h2>
        {loading ? (
          <Spinner text="Loading subscriptions..." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm">No subscriptions yet.</p>
            <p className="text-gray-400 text-xs mt-1">Browse creators to get started!</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {subscriptions.map((sub: any) => {
              const creator = sub.creator || sub;
              return (
                <Link
                  key={creator.id}
                  href={`/user/${creator.id}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group"
                >
                  <div className="relative">
                    {creator.avatar ? (
                      <img
                        src={mediaUrl(creator.avatar)}
                        alt={creator.username}
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#e8125c] group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center border-2 border-[#e8125c] text-[#e8125c] font-bold text-lg">
                        {creator.username?.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 max-w-[72px] truncate">
                    {creator.display_name || creator.full_name || creator.username}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
