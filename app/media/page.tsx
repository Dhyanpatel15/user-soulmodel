"use client";

import { useEffect, useMemo, useState } from "react";
import { subscriptionsApi, browseApi, mediaUrl } from "@/lib/api";
import { Lock, Play, Image as ImageIcon, X } from "lucide-react";
import Spinner from "@/components/Spinner";

function safeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function normalizeSubscriptions(data: any) {
  return Array.isArray(data)
    ? data
    : data?.data || data?.items || data?.results || [];
}

function normalizePosts(data: any) {
  return Array.isArray(data)
    ? data
    : data?.data || data?.items || data?.posts || data?.results || data?.rows || [];
}

function pushMediaItem(store: any[], rawUrl: any, rawType?: any, extra: any = {}) {
  if (!rawUrl || typeof rawUrl !== "string") return;

  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) return;

  const isVideo =
    String(rawType || "").toLowerCase().includes("video") ||
    /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(cleanUrl);

  const isImage =
    /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(cleanUrl) ||
    cleanUrl.includes("/media/") ||
    cleanUrl.includes("/uploads/") ||
    cleanUrl.includes("/images/") ||
    cleanUrl.startsWith("media/") ||
    cleanUrl.startsWith("uploads/");

  if (!isVideo && !isImage) return;

  store.push({
    url: cleanUrl,
    type: isVideo ? "video" : "image",
    ...extra,
  });
}

function scanForMedia(value: any, store: any[], extra: any = {}, visited = new WeakSet()) {
  if (!value) return;

  if (typeof value === "string") {
    pushMediaItem(store, value, undefined, extra);
    return;
  }

  if (typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => scanForMedia(item, store, extra, visited));
    return;
  }

  const mediaKeys = [
    "url",
    "file",
    "src",
    "path",
    "media_url",
    "image",
    "image_url",
    "photo",
    "photo_url",
    "thumbnail",
    "thumbnail_url",
    "poster",
    "cover",
    "video",
    "video_url",
    "preview_url",
  ];

  mediaKeys.forEach((key) => {
    if (key in value) {
      pushMediaItem(
        store,
        value[key],
        value.type || value.media_type || key,
        extra
      );
    }
  });

  Object.entries(value).forEach(([key, val]) => {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("image") ||
      lowerKey.includes("img") ||
      lowerKey.includes("photo") ||
      lowerKey.includes("thumbnail") ||
      lowerKey.includes("poster") ||
      lowerKey.includes("video") ||
      lowerKey.includes("media") ||
      lowerKey.includes("file") ||
      lowerKey.includes("attachment") ||
      lowerKey.includes("gallery") ||
      lowerKey.includes("asset") ||
      lowerKey.includes("upload")
    ) {
      if (typeof val === "string") {
        pushMediaItem(store, val, lowerKey, extra);
      } else {
        scanForMedia(val, store, extra, visited);
      }
    }
  });

  Object.values(value).forEach((val) => {
    if (typeof val === "object") {
      scanForMedia(val, store, extra, visited);
    }
  });
}

function getPostMedia(post: any) {
  const mediaItems: any[] = [];

  const locked =
    post?.is_locked ||
    post?.locked ||
    post?.requires_subscription ||
    (!post?.is_free && post?.is_free !== undefined);

  const creator =
    post?.creator ||
    post?.user ||
    post?.author ||
    {};

  const extra = {
    locked: Boolean(locked),
    creator,
    postId: post?.id,
  };

  scanForMedia(post, mediaItems, extra);

  return mediaItems.filter(
    (item, index, arr) =>
      item?.url &&
      arr.findIndex(
        (x) =>
          x.url === item.url &&
          x.type === item.type &&
          x.postId === item.postId
      ) === index
  );
}

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const subs = await subscriptionsApi.getMySubscriptions();
        const subList = normalizeSubscriptions(subs);
        const allMedia: any[] = [];

        await Promise.all(
          subList.map(async (sub: any, subIndex: number) => {
            const creatorId =
              sub?.creator?.id ||
              sub?.creator_id ||
              sub?.id;

            if (!creatorId) return;

            try {
              const data = await browseApi.getCreatorPosts(creatorId);
              const posts = normalizePosts(data);

              posts.forEach((post: any, postIndex: number) => {
                const extracted = getPostMedia(post);

                extracted.forEach((m: any, mediaIndex: number) => {
                  allMedia.push({
                    id: `${creatorId}-${post?.id || postIndex}-${mediaIndex}-${subIndex}`,
                    src: mediaUrl(m.url),
                    originalUrl: m.url,
                    type: m.type,
                    locked: m.locked,
                    creator: m.creator || sub?.creator || {},
                    postId: m.postId || post?.id,
                  });
                });
              });

              console.log("MediaPage creator posts response:", creatorId, data);
              console.log("MediaPage normalized posts:", posts);
              console.log(
                "MediaPage extracted media:",
                posts.flatMap((p: any) => getPostMedia(p))
              );
            } catch (error) {
              console.log("MediaPage error loading creator posts:", creatorId, error);
            }
          })
        );

        const uniqueMedia = allMedia.filter(
          (item, index, arr) =>
            arr.findIndex(
              (x) =>
                x.originalUrl === item.originalUrl &&
                x.type === item.type &&
                x.postId === item.postId
            ) === index
        );

        setMedia(uniqueMedia);
      } catch (error) {
        console.log("MediaPage subscriptions error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return media.filter((m) => (filter === "all" ? true : m.type === filter));
  }, [media, filter]);

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Media</h1>
        <p className="text-gray-500 text-sm mb-6">
          Photos and videos from your subscriptions
        </p>

        <div className="flex gap-2 mb-6">
          {(["all", "image", "video"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === tab
                  ? "bg-[#e8125c] text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-[#e8125c] hover:text-[#e8125c]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <Spinner text="Loading media..." />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400">No media found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.locked) {
                    setSelectedMedia(item);
                  }
                }}
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl bg-gray-100 border border-gray-200"
              >
                {item.type === "video" ? (
                  <video
                    src={item.src}
                    className={`w-full h-full object-cover ${
                      item.locked ? "blur-md brightness-75" : ""
                    }`}
                    muted
                    playsInline
                    controls={false}
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.src}
                    alt="Media"
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                      item.locked ? "blur-md brightness-75" : ""
                    }`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                )}

                {item.locked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/40 rounded-full p-3">
                      <Lock size={20} className="text-white" />
                    </div>
                  </div>
                )}

                {item.type === "video" && !item.locked && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-black/40 rounded-full p-3">
                      <Play size={20} className="text-white fill-white" />
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">
                    @{item.creator?.username || "creator"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
            >
              <X size={24} />
            </button>

            {selectedMedia.type === "video" ? (
              <video
                src={selectedMedia.src}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
              />
            ) : (
              <img
                src={selectedMedia.src}
                alt="Full view"
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
            )}

            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-sm truncate">
                @{selectedMedia.creator?.username || "creator"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}