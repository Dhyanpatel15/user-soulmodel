"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { browseApi, subscriptionsApi, mediaUrl } from "@/lib/api";
import {
  RefreshCw,
  BadgeCheck,
  MoreHorizontal,
  Plus,
  Check,
  Users,
} from "lucide-react";

type Creator = {
  id: string | number;
  username: string;
  display_name?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  cover_url?: string;
  cover?: string;
  banner?: string;
  profile_banner?: string;
  is_verified?: boolean;
  is_free?: boolean;
  subscription_price?: number;
  bio?: string;
  is_online?: boolean;
  subscribers_count?: number;
};

function resolveImageUrl(path?: string | null) {
  if (!path) return "";

  const clean = String(path).trim();
  if (!clean) return "";

  try {
    return mediaUrl(clean, true);
  } catch {
    return clean;
  }
}

function Avatar({
  creator,
  size = 52,
}: {
  creator: Creator;
  size?: number;
}) {
  const [err, setErr] = useState(false);

  useEffect(() => {
    setErr(false);
  }, [creator.id, creator.avatar_url]);

  const src = resolveImageUrl(creator.avatar_url);
  const name = creator.display_name || creator.username || "C";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className="relative shrink-0 rounded-full overflow-hidden bg-gray-100 border border-gray-200"
      style={{ width: size, height: size }}
    >
      {src && !err ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-[#e8125c] bg-pink-50">
          {initials}
        </div>
      )}

      {creator.is_online && (
        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
      )}
    </div>
  );
}

function CreatorFeedCard({
  creator,
  subscribed,
  onSubscribe,
  onDismiss,
}: {
  creator: Creator;
  subscribed: boolean;
  onSubscribe: (id: string | number) => void;
  onDismiss: (id: string | number) => void;
}) {
  const [coverErr, setCoverErr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCoverErr(false);
  }, [
    creator.id,
    creator.cover_photo_url,
    creator.cover_url,
    creator.cover,
    creator.banner,
    creator.profile_banner,
  ]);

  const coverSrc = resolveImageUrl(
    creator.cover_photo_url ||
      creator.cover_url ||
      creator.cover ||
      creator.banner ||
      creator.profile_banner
  );

  const isFree =
    creator.is_free === true || Number(creator.subscription_price || 0) === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="relative h-40 w-full bg-gray-100">
        {coverSrc && !coverErr ? (
          <img
            src={coverSrc}
            alt={creator.display_name || creator.username}
            className="w-full h-full object-cover"
            onError={() => {
              console.log("Cover image failed:", coverSrc, creator);
              setCoverErr(true);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow"
          >
            <MoreHorizontal size={16} className="text-gray-700" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
              <Link
                href={`/user/${creator.id}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                View profile
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDismiss(creator.id);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Not interested
              </button>
            </div>
          )}
        </div>

        {isFree && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-gray-700 shadow">
            Free
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar creator={creator} size={56} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {creator.display_name || creator.username}
              </h3>
              {creator.is_verified && (
                <BadgeCheck size={15} className="text-blue-500 shrink-0" />
              )}
            </div>

            <p className="text-xs text-gray-500 truncate">@{creator.username}</p>

            {creator.bio ? (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {creator.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                {creator.subscribers_count
                  ? `${creator.subscribers_count.toLocaleString()} subscribers`
                  : isFree
                  ? "Free subscription"
                  : `$${creator.subscription_price}/month`}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Link
            href={`/user/${creator.id}`}
            className="text-sm font-medium text-[#e8125c] hover:underline"
          >
            View profile
          </Link>

          <button
            onClick={() => onSubscribe(creator.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              subscribed
                ? "bg-gray-100 text-gray-600 border border-gray-200"
                : "bg-[#e8125c] text-white hover:bg-[#c91050]"
            }`}
          >
            {subscribed ? (
              <>
                <Check size={14} />
                Following
              </>
            ) : (
              <>
                <Plus size={14} />
                {isFree ? "Follow" : "Subscribe"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 animate-pulse">
      <div className="h-40 bg-gray-200 rounded-xl mb-4" />
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-36 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-3 w-full bg-gray-200 rounded mb-2" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-10 w-28 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function SuggestionsPage() {
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else {
      setLoading(true);
      setError("");
    }

    try {
      const [creators, subs] = await Promise.all([
        browseApi.getCreatorsList(100, 0),
        subscriptionsApi.getMySubscriptions().catch(() => []),
      ]);

      const cleanCreators = (Array.isArray(creators) ? creators : [])
        .filter((c: any) => c && c.id && (c.username || c.display_name))
        .map((c: any) => ({
          ...c,
          cover_photo_url:
            c.cover_photo_url ||
            c.cover_url ||
            c.cover ||
            c.banner ||
            c.profile_banner ||
            "",
          avatar_url:
            c.avatar_url ||
            c.profile_photo ||
            c.profile_image ||
            c.avatar ||
            "",
        }));

      setAllCreators(cleanCreators);

      const subList: any[] = Array.isArray(subs)
        ? subs
        : subs?.data || subs?.items || subs?.results || [];

      const ids = new Set<string>(
        subList
          .map((s: any) => String(s?.creator?.id || s?.creator_id || s?.id || ""))
          .filter(Boolean)
      );

      setSubscribedIds(ids);
    } catch (e: any) {
      setError(e?.message || "Failed to load creators");
      console.error("SuggestionsPage load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visibleCreators = useMemo(() => {
    return allCreators.filter((c) => !dismissedIds.has(String(c.id)));
  }, [allCreators, dismissedIds]);

  const handleSubscribe = async (id: string | number) => {
    const key = String(id);
    const wasSubbed = subscribedIds.has(key);

    setSubscribedIds((prev) => {
      const next = new Set(prev);
      if (wasSubbed) next.delete(key);
      else next.add(key);
      return next;
    });

    try {
      if (wasSubbed) {
        await subscriptionsApi.unsubscribe(id);
      } else {
        await subscriptionsApi.subscribe(id);
      }
    } catch (e) {
      setSubscribedIds((prev) => {
        const next = new Set(prev);
        if (wasSubbed) next.add(key);
        else next.delete(key);
        return next;
      });
    }
  };

  const handleDismiss = (id: string | number) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(String(id));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6" ref={listRef}>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#e8125c]" />
              <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Discover creators you may want to follow
            </p>
          </div>

          <button
            onClick={() => load(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {!loading && visibleCreators.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            {visibleCreators.length} creators found
          </div>
        )}

        {error && !loading && (
          <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={() => load()}
              className="font-semibold text-[#e8125c] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : visibleCreators.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h2 className="text-lg font-semibold text-gray-800">
                No creators found
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Try refreshing and check again later.
              </p>
              <button
                onClick={() => load(true)}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#e8125c] text-white font-medium hover:bg-[#c91050]"
              >
                Refresh
              </button>
            </div>
          ) : (
            visibleCreators.map((creator) => (
              <CreatorFeedCard
                key={String(creator.id)}
                creator={creator}
                subscribed={subscribedIds.has(String(creator.id))}
                onSubscribe={handleSubscribe}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}