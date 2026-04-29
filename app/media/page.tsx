"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  subscriptionsApi,
  browseApi,
  mediaUrl,
  userProfileApi,
  getToken,
  clearLoggedInUserCache,
} from "@/lib/api";
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
    : data?.data ||
        data?.items ||
        data?.posts ||
        data?.results ||
        data?.rows ||
        [];
}

function getStringValue(value: any): string {
  if (value === null || value === undefined) return "";

  const str = String(value).trim();

  if (!str) return "";
  if (str.toLowerCase() === "null") return "";
  if (str.toLowerCase() === "undefined") return "";
  if (str.toLowerCase() === "user") return "";

  return str;
}

function extractLoggedInUsername(data: any): string {
  if (!data) return "";

  const possibleUsers = [
    data,
    data?.data,
    data?.user,
    data?.profile,
    data?.current_user,
    data?.currentUser,
    data?.logged_in_user,
    data?.loggedInUser,
    data?.auth_user,
    data?.authUser,
    data?.data?.user,
    data?.data?.profile,
    data?.data?.current_user,
    data?.data?.currentUser,
    data?.data?.logged_in_user,
    data?.data?.loggedInUser,
    data?.data?.auth_user,
    data?.data?.authUser,
  ];

  for (const user of possibleUsers) {
    const username =
      getStringValue(user?.username) ||
      getStringValue(user?.user_name) ||
      getStringValue(user?.handle) ||
      getStringValue(user?.display_name) ||
      getStringValue(user?.full_name) ||
      getStringValue(user?.name);

    if (username) return username;
  }

  return "";
}

function pushMediaItem(
  store: any[],
  rawUrl: any,
  rawType?: any,
  extra: any = {}
) {
  if (!rawUrl || typeof rawUrl !== "string") return;

  const cleanUrl = rawUrl.trim();
  if (!cleanUrl) return;

  const isVideo =
    String(rawType || "").toLowerCase().includes("video") ||
    /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(cleanUrl);

  const isImage =
    String(rawType || "").toLowerCase().includes("image") ||
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

function scanForMedia(
  value: any,
  store: any[],
  extra: any = {},
  visited = new WeakSet()
) {
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
    "file_url",
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

function getCreatorId(source: any) {
  return (
    source?.creator?.id ||
    source?.creator_id ||
    source?.id ||
    source?.user_id ||
    null
  );
}

function getPostMedia(post: any, subscribedCreatorIds = new Set<string>()) {
  const mediaItems: any[] = [];

  const creator = post?.creator || post?.user || post?.author || {};

  const creatorId = getCreatorId({
    creator,
    creator_id: post?.creator_id,
    user_id: post?.user_id,
  });

  const creatorKey = creatorId != null ? String(creatorId) : "";
  const isSubscribedCreator = creatorKey
    ? subscribedCreatorIds.has(creatorKey)
    : false;

  const isPremiumPost = Boolean(
    post?.is_premium ||
      post?.is_ppv ||
      post?.ppv ||
      post?.is_paid ||
      post?.paid_post ||
      post?.visibility === "premium" ||
      post?.visibility === "ppv"
  );

  const locked = isPremiumPost ? !isSubscribedCreator : false;

  const extra = {
    locked,
    creator,
    creatorId,
    postId: post?.id,
    isPremiumPost,
    isSubscribedCreator,
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
  const [loggedInUsername, setLoggedInUsername] = useState<string>("");

  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (
        (e.ctrlKey && key === "s") ||
        (e.ctrlKey && key === "u") ||
        (e.ctrlKey && e.shiftKey && key === "i") ||
        (e.ctrlKey && e.shiftKey && key === "j") ||
        key === "f12"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("keydown", blockKeys);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadLoggedInUsername = async () => {
      try {
        const currentToken = getToken();

        if (!currentToken) {
          if (active) {
            setLoggedInUsername("");
          }

          clearLoggedInUserCache();
          return;
        }

        const cachedUsername = localStorage.getItem("loggedInUsername");
        const cachedToken = localStorage.getItem("loggedInUsernameToken");

        if (cachedUsername && cachedToken === currentToken) {
          if (active) {
            setLoggedInUsername(cachedUsername);
          }

          return;
        }

        localStorage.removeItem("loggedInUsername");
        localStorage.removeItem("loggedInUsernameToken");

        const profile = await userProfileApi.getMe();

        console.log("Current logged-in profile for media watermark:", profile);

        const username = extractLoggedInUsername(profile);

        if (username && active) {
          setLoggedInUsername(username);

          localStorage.setItem("loggedInUsername", username);
          localStorage.setItem("loggedInUsernameToken", currentToken);

          return;
        }

        if (active) {
          setLoggedInUsername("");
        }

        console.error(
          "Username not found in current profile response. Backend must send username."
        );
      } catch (error) {
        console.error("Failed to load current logged-in username:", error);

        if (active) {
          setLoggedInUsername("");
        }

        localStorage.removeItem("loggedInUsername");
        localStorage.removeItem("loggedInUsernameToken");
      }
    };

    loadLoggedInUsername();

    const refreshUsername = () => {
      loadLoggedInUsername();
    };

    window.addEventListener("storage", refreshUsername);
    window.addEventListener("focus", refreshUsername);

    return () => {
      active = false;
      window.removeEventListener("storage", refreshUsername);
      window.removeEventListener("focus", refreshUsername);
    };
  }, []);

  const blockMediaDownload = (
    e:
      | React.SyntheticEvent
      | React.MouseEvent
      | React.DragEvent
      | React.TouchEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const cleanWatermarkName = loggedInUsername || "User";

  const watermarkText = cleanWatermarkName.startsWith("@")
    ? cleanWatermarkName
    : `@${cleanWatermarkName}`;

  const RepeatedWatermark = ({ text }: { text: string }) => (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10">
      <div
        className="absolute inset-[-20%] opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`
            <svg xmlns='http://www.w3.org/2000/svg' width='170' height='110' viewBox='0 0 220 140'>
              <text
                x='18'
                y='72'
                fill='white'
                fill-opacity='0.9'
                font-size='18'
                font-family='Arial, sans-serif'
                font-weight='700'
                transform='rotate(-30 110 70)'
              >
                ${text}
              </text>
            </svg>
          `)}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "170px 110px",
        }}
      />
    </div>
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const subs = await subscriptionsApi.getMySubscriptions();
        const subList = normalizeSubscriptions(subs);
        const subscribedCreatorIds = new Set<string>();
        const allMedia: any[] = [];

        subList.forEach((sub: any) => {
          const creatorId = getCreatorId(sub);
          if (creatorId != null) {
            subscribedCreatorIds.add(String(creatorId));
          }
        });

        await Promise.all(
          subList.map(async (sub: any, subIndex: number) => {
            const creatorId = getCreatorId(sub);

            if (!creatorId) return;

            try {
              const data = await browseApi.getCreatorPosts(creatorId);
              const posts = normalizePosts(data);

              posts.forEach((post: any, postIndex: number) => {
                const extracted = getPostMedia(post, subscribedCreatorIds);

                extracted.forEach((m: any, mediaIndex: number) => {
                  allMedia.push({
                    id: `${creatorId}-${post?.id || postIndex}-${mediaIndex}-${subIndex}`,
                    src: mediaUrl(m.url),
                    originalUrl: m.url,
                    type: m.type,
                    locked: Boolean(m.locked),
                    creator: m.creator || sub?.creator || {},
                    creatorId: m.creatorId || creatorId,
                    postId: m.postId || post?.id,
                    isPremiumPost: Boolean(m.isPremiumPost),
                  });
                });
              });

              console.log("MediaPage creator posts response:", creatorId, data);
              console.log("MediaPage normalized posts:", posts);
              console.log(
                "MediaPage extracted media:",
                posts.flatMap((p: any) => getPostMedia(p, subscribedCreatorIds))
              );
            } catch (error) {
              console.log(
                "MediaPage error loading creator posts:",
                creatorId,
                error
              );
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
      <div
        className="max-w-3xl mx-auto px-4 py-8 select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        }}
      >
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
            {filtered.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.locked) {
                      setSelectedMedia(item);
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative aspect-square group cursor-pointer overflow-hidden rounded-xl bg-gray-100 border border-gray-200 select-none"
                  style={{
                    WebkitUserSelect: "none",
                    userSelect: "none",
                    WebkitTouchCallout: "none",
                  }}
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
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      preload="metadata"
                      onContextMenu={blockMediaDownload}
                      onDragStart={blockMediaDownload}
                    />
                  ) : (
                    <img
                      src={item.src}
                      alt="Media"
                      draggable={false}
                      onContextMenu={blockMediaDownload}
                      onDragStart={blockMediaDownload}
                      onMouseDown={(e) => {
                        if (e.button === 2) blockMediaDownload(e);
                      }}
                      className={`w-full h-full object-cover transition-transform group-hover:scale-105 select-none ${
                        item.locked ? "blur-md brightness-75" : ""
                      }`}
                      style={{
                        WebkitUserSelect: "none",
                        userSelect: "none",
                        WebkitTouchCallout: "none",
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "/placeholder.jpg";
                      }}
                    />
                  )}

                  {!item.locked && <RepeatedWatermark text={watermarkText} />}

                  {item.locked && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="bg-black/40 rounded-full p-3">
                        <Lock size={20} className="text-white" />
                      </div>
                    </div>
                  )}

                  {item.type === "video" && !item.locked && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-black/40 rounded-full p-3">
                        <Play size={20} className="text-white fill-white" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <p className="text-white text-xs truncate">
                      @{item.creator?.username || "creator"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 select-none"
          onClick={() => setSelectedMedia(null)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          <div
            className="relative w-full h-full flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
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
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={blockMediaDownload}
                onDragStart={blockMediaDownload}
                className="max-w-full max-h-[90vh] rounded-xl object-contain"
              />
            ) : (
              <img
                src={selectedMedia.src}
                alt="Full view"
                draggable={false}
                onContextMenu={blockMediaDownload}
                onDragStart={blockMediaDownload}
                onMouseDown={(e) => {
                  if (e.button === 2) blockMediaDownload(e);
                }}
                className="max-w-full max-h-[90vh] rounded-xl object-contain select-none"
                style={{
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/placeholder.jpg";
                }}
              />
            )}

            <RepeatedWatermark text={watermarkText} />

            <div className="absolute bottom-4 left-4 right-4 text-center z-20">
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