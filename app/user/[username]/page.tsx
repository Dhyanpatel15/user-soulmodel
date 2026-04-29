"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  browseApi,
  subscriptionsApi,
  messagesApi,
  mediaUrl,
  userProfileApi,
  getToken,
  clearLoggedInUserCache,
} from "@/lib/api";
import PostCard from "@/components/PostCard";
import Spinner from "@/components/Spinner";
import {
  BadgeCheck,
  Bell,
  MessageCircle,
  Wallet,
  Grid3X3,
  FileText,
  Image as ImageIcon,
  Loader2,
  Play,
  Lock,
  X,
} from "lucide-react";

type TabType = "posts" | "media" | "about";

function safeArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function firstDefined(...values: any[]) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
}

function toBoolean(value: any) {
  if (value === true) return true;
  if (value === false) return false;

  if (typeof value === "string") {
    const clean = value.trim().toLowerCase();

    if (
      clean === "true" ||
      clean === "yes" ||
      clean === "1" ||
      clean === "active" ||
      clean === "subscribed"
    ) {
      return true;
    }

    if (
      clean === "false" ||
      clean === "no" ||
      clean === "0" ||
      clean === "inactive" ||
      clean === "unsubscribed"
    ) {
      return false;
    }
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return false;
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

function extractAssetUrl(value: any): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const clean = value.trim();
    return clean || null;
  }

  if (typeof value !== "object") return null;

  return firstDefined(
    value?.url,
    value?.file,
    value?.src,
    value?.path,
    value?.image,
    value?.image_url,
    value?.photo,
    value?.photo_url,
    value?.avatar,
    value?.avatar_url,
    value?.profile_image,
    value?.profile_image_url,
    value?.profile_picture,
    value?.profile_photo,
    value?.profile_photo_url,
    value?.cover,
    value?.cover_url,
    value?.cover_image,
    value?.cover_image_url,
    value?.cover_photo,
    value?.cover_photo_url,
    value?.banner,
    value?.banner_url,
    value?.banner_image,
    value?.banner_image_url,
    value?.header_image,
    value?.header_image_url,
    value?.background_image,
    value?.background_image_url,
    value?.upload,
    value?.upload_url
  );
}

function normalizeCreator(raw: any) {
  const dataLayer = raw?.data || {};
  const creatorLayer =
    dataLayer?.creator || raw?.creator || dataLayer || raw || {};

  const subscriptionLayer =
    dataLayer?.subscription ||
    raw?.subscription ||
    creatorLayer?.subscription ||
    {};

  const nestedUser = creatorLayer?.user || raw?.user || dataLayer?.user || {};

  const id = firstDefined(
    creatorLayer?.id,
    creatorLayer?.creator_id,
    creatorLayer?.user_id,
    raw?.id,
    raw?.creator_id,
    raw?.user_id,
    nestedUser?.id
  );

  const username = firstDefined(
    creatorLayer?.username,
    creatorLayer?.user_name,
    creatorLayer?.handle,
    raw?.username,
    raw?.user_name,
    nestedUser?.username,
    nestedUser?.user_name,
    nestedUser?.handle
  );

  const displayName = firstDefined(
    creatorLayer?.display_name,
    creatorLayer?.full_name,
    creatorLayer?.name,
    raw?.display_name,
    raw?.full_name,
    raw?.name,
    nestedUser?.display_name,
    nestedUser?.full_name,
    nestedUser?.name,
    username,
    "Creator"
  );

  const avatar = firstDefined(
    extractAssetUrl(creatorLayer?.avatar),
    extractAssetUrl(creatorLayer?.avatar_url),
    extractAssetUrl(creatorLayer?.profile_image),
    extractAssetUrl(creatorLayer?.profile_image_url),
    extractAssetUrl(creatorLayer?.profile_picture),
    extractAssetUrl(creatorLayer?.profile_photo),
    extractAssetUrl(creatorLayer?.profile_photo_url),
    extractAssetUrl(creatorLayer?.image),
    extractAssetUrl(creatorLayer?.image_url),

    extractAssetUrl(raw?.avatar),
    extractAssetUrl(raw?.avatar_url),
    extractAssetUrl(raw?.profile_image),
    extractAssetUrl(raw?.profile_image_url),

    extractAssetUrl(nestedUser?.avatar),
    extractAssetUrl(nestedUser?.avatar_url),
    extractAssetUrl(nestedUser?.profile_image),
    extractAssetUrl(nestedUser?.profile_image_url),
    extractAssetUrl(nestedUser?.profile_picture),
    extractAssetUrl(nestedUser?.profile_photo),
    extractAssetUrl(nestedUser?.photo),
    extractAssetUrl(nestedUser?.image)
  );

  const banner = firstDefined(
    extractAssetUrl(creatorLayer?.banner),
    extractAssetUrl(creatorLayer?.banner_url),
    extractAssetUrl(creatorLayer?.banner_image),
    extractAssetUrl(creatorLayer?.banner_image_url),
    extractAssetUrl(creatorLayer?.cover),
    extractAssetUrl(creatorLayer?.cover_url),
    extractAssetUrl(creatorLayer?.cover_image),
    extractAssetUrl(creatorLayer?.cover_image_url),
    extractAssetUrl(creatorLayer?.cover_photo),
    extractAssetUrl(creatorLayer?.cover_photo_url),
    extractAssetUrl(creatorLayer?.header_image),
    extractAssetUrl(creatorLayer?.header_image_url),
    extractAssetUrl(creatorLayer?.background_image),
    extractAssetUrl(creatorLayer?.background_image_url),

    extractAssetUrl(raw?.banner),
    extractAssetUrl(raw?.banner_url),
    extractAssetUrl(raw?.cover),
    extractAssetUrl(raw?.cover_url),
    extractAssetUrl(raw?.cover_image),
    extractAssetUrl(raw?.cover_image_url),

    extractAssetUrl(nestedUser?.banner),
    extractAssetUrl(nestedUser?.banner_url),
    extractAssetUrl(nestedUser?.cover),
    extractAssetUrl(nestedUser?.cover_url),
    extractAssetUrl(nestedUser?.cover_image),
    extractAssetUrl(nestedUser?.cover_image_url)
  );

  const bio = firstDefined(
    creatorLayer?.bio,
    creatorLayer?.description,
    creatorLayer?.about,
    raw?.bio,
    raw?.description,
    raw?.about,
    nestedUser?.bio,
    nestedUser?.description,
    nestedUser?.about
  );

  const location = firstDefined(
    creatorLayer?.location,
    creatorLayer?.city,
    raw?.location,
    raw?.city,
    nestedUser?.location,
    nestedUser?.city
  );

  const website = firstDefined(
    creatorLayer?.website,
    creatorLayer?.site_url,
    raw?.website,
    raw?.site_url,
    nestedUser?.website,
    nestedUser?.site_url
  );

  const isVerified = Boolean(
    firstDefined(
      creatorLayer?.is_verified,
      creatorLayer?.verified,
      raw?.is_verified,
      raw?.verified,
      nestedUser?.is_verified,
      nestedUser?.verified,
      false
    )
  );

  const subscriptionStatus = String(
    firstDefined(
      subscriptionLayer?.status,
      subscriptionLayer?.subscription_status,
      subscriptionLayer?.payment_status,
      creatorLayer?.subscription_status,
      raw?.subscription_status,
      ""
    )
  ).toLowerCase();

  const subscriptionFlag = firstDefined(
    subscriptionLayer?.is_subscribed,
    subscriptionLayer?.subscribed,
    subscriptionLayer?.active,
    subscriptionLayer?.is_active,

    creatorLayer?.is_subscribed,
    creatorLayer?.subscribed,
    creatorLayer?.active_subscription,
    creatorLayer?.has_active_subscription,

    raw?.is_subscribed,
    raw?.subscribed,
    raw?.active_subscription,
    raw?.has_active_subscription,

    nestedUser?.is_subscribed,
    nestedUser?.subscribed,

    false
  );

  const isSubscribed = Boolean(
    toBoolean(subscriptionFlag) ||
      subscriptionStatus === "active" ||
      subscriptionStatus === "paid" ||
      subscriptionStatus === "success" ||
      subscriptionStatus === "trialing" ||
      Boolean(subscriptionLayer?.subscription_id) ||
      Boolean(subscriptionLayer?.user_subscription_id) ||
      Boolean(subscriptionLayer?.creator_subscription_id)
  );

  const subscriptionPrice = Number(
    firstDefined(
      subscriptionLayer?.subscription_price,
      subscriptionLayer?.price,
      subscriptionLayer?.monthly_price,
      creatorLayer?.subscription_price,
      creatorLayer?.price,
      creatorLayer?.monthly_price,
      raw?.subscription_price,
      raw?.price,
      raw?.monthly_price,
      nestedUser?.subscription_price,
      nestedUser?.price,
      nestedUser?.monthly_price,
      0
    ) || 0
  );

  const subscribersCount = Number(
    firstDefined(
      creatorLayer?.subscribers_count,
      creatorLayer?.subscriber_count,
      creatorLayer?.subscribers,
      raw?.subscribers_count,
      raw?.subscriber_count,
      raw?.subscribers,
      nestedUser?.subscribers_count,
      nestedUser?.subscriber_count,
      nestedUser?.subscribers,
      0
    ) || 0
  );

  const postsCount = Number(
    firstDefined(
      creatorLayer?.posts_count,
      creatorLayer?.total_posts,
      creatorLayer?.post_count,
      raw?.posts_count,
      raw?.total_posts,
      raw?.post_count,
      nestedUser?.posts_count,
      nestedUser?.total_posts,
      nestedUser?.post_count,
      0
    ) || 0
  );

  const mediaCount = Number(
    firstDefined(
      creatorLayer?.media_count,
      creatorLayer?.total_media,
      creatorLayer?.media_total,
      raw?.media_count,
      raw?.total_media,
      raw?.media_total,
      nestedUser?.media_count,
      nestedUser?.total_media,
      nestedUser?.media_total,
      0
    ) || 0
  );

  return {
    raw,
    creator_raw: creatorLayer,
    subscription_raw: subscriptionLayer,
    id,
    username,
    display_name: displayName,
    avatar,
    banner,
    bio,
    location,
    website,
    is_verified: isVerified,
    is_subscribed: isSubscribed,
    subscription_price: subscriptionPrice,
    subscribers_count: subscribersCount,
    posts_count: postsCount,
    media_count: mediaCount,
  };
}

function normalizePosts(data: any) {
  const list = Array.isArray(data)
    ? data
    : data?.data ||
      data?.items ||
      data?.posts ||
      data?.results ||
      data?.rows ||
      [];

  return safeArray(list).map((p: any) => ({
    ...p,
    is_ppv: Boolean(
      p?.is_ppv ||
        p?.ppv ||
        p?.is_paid ||
        p?.paid_post ||
        p?.locked ||
        p?.is_locked
    ),
    is_locked: Boolean(
      p?.is_locked ||
        p?.locked ||
        p?.is_ppv ||
        p?.ppv ||
        p?.is_paid ||
        p?.paid_post ||
        (!p?.is_free && p?.is_free !== undefined)
    ),
  }));
}

function isPPVPost(post: any) {
  return Boolean(
    post?.is_ppv ||
      post?.ppv ||
      post?.is_paid ||
      post?.paid_post ||
      post?.locked ||
      post?.is_locked ||
      (!post?.is_free && post?.is_free !== undefined)
  );
}

function getLikeCount(post: any) {
  return Number(
    post?.like_count ??
      post?.likes_count ??
      post?.total_likes ??
      post?.likes ??
      0
  );
}

function isPostLiked(post: any) {
  return Boolean(post?.is_liked ?? post?.liked ?? post?.has_liked ?? false);
}

function pushMediaItem(store: any[], rawUrl: any, rawType?: any) {
  const extractedUrl = extractAssetUrl(rawUrl);
  if (!extractedUrl || typeof extractedUrl !== "string") return;

  const cleanUrl = extractedUrl.trim();
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
  });
}

function scanForMedia(value: any, store: any[], visited = new WeakSet()) {
  if (!value) return;

  if (typeof value === "string") {
    pushMediaItem(store, value);
    return;
  }

  if (typeof value !== "object") return;
  if (visited.has(value)) return;
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => scanForMedia(item, store, visited));
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
    "cover_photo",
    "cover_photo_url",
    "cover_image",
    "cover_image_url",
    "banner",
    "banner_url",
    "banner_image",
    "banner_image_url",
    "avatar",
    "avatar_url",
    "profile_image",
    "profile_image_url",
    "profile_picture",
    "profile_photo",
    "profile_photo_url",
    "upload_image",
    "video",
    "video_url",
    "preview_url",
  ];

  mediaKeys.forEach((key) => {
    if (key in value) {
      pushMediaItem(store, value[key], value.type || value.media_type || key);
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
      lowerKey.includes("upload") ||
      lowerKey.includes("avatar") ||
      lowerKey.includes("cover") ||
      lowerKey.includes("banner")
    ) {
      if (typeof val === "string") {
        pushMediaItem(store, val, lowerKey);
      } else {
        scanForMedia(val, store, visited);
      }
    }
  });

  Object.values(value).forEach((val) => {
    if (typeof val === "object") {
      scanForMedia(val, store, visited);
    }
  });
}

function getPostMedia(post: any) {
  const mediaItems: any[] = [];
  scanForMedia(post, mediaItems);

  return mediaItems.filter(
    (item, index, arr) =>
      item?.url &&
      arr.findIndex((x) => x.url === item.url && x.type === item.type) === index
  );
}

export default function UserPage() {
  const params = useParams();
  const routeValue = String(params?.username || "").trim();

  const [creator, setCreator] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [notFound, setNotFound] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [bannerBroken, setBannerBroken] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [loggedInUsername, setLoggedInUsername] = useState<string>("");

  const blockMediaDownload = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getWatermarkText = () => {
    const cleanWatermarkName = loggedInUsername || "User";

    return cleanWatermarkName.startsWith("@")
      ? cleanWatermarkName
      : `@${cleanWatermarkName}`;
  };

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

        console.log("Current logged-in profile for photo watermark:", profile);

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setAvatarBroken(false);
      setBannerBroken(false);

      try {
        let profile: any = null;

        try {
          profile = await browseApi.getCreatorProfile(routeValue);
        } catch {
          profile = null;
        }

        const normalizedCreator = normalizeCreator(profile);

        if (
          !normalizedCreator?.id &&
          !normalizedCreator?.username &&
          !normalizedCreator?.display_name
        ) {
          setNotFound(true);
          setCreator(null);
          setPosts([]);
          return;
        }

        setCreator(normalizedCreator);
        setSubscribed(Boolean(normalizedCreator?.is_subscribed));

        const postLookupId =
          normalizedCreator?.id || normalizedCreator?.username || routeValue;

        let postsData: any = [];

        try {
          postsData = await browseApi.getCreatorPosts(postLookupId);
        } catch {
          postsData = [];
        }

        const normalized = normalizePosts(postsData);
        setPosts(normalized);

        console.log("Creator profile response:", profile);
        console.log("Normalized creator:", normalizedCreator);
        console.log("Is subscribed:", normalizedCreator.is_subscribed);
        console.log(
          "Subscription raw object:",
          normalizedCreator.subscription_raw
        );
      } catch (e: any) {
        if (
          e?.message?.includes("404") ||
          e?.message?.toLowerCase?.().includes("not found")
        ) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (routeValue) {
      load();
    }
  }, [routeValue]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMedia(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSubscribe = async () => {
    if (!creator?.id && !creator?.username) return;

    setSubLoading(true);

    try {
      const targetId = creator?.id || creator?.username;

      if (subscribed) {
        await subscriptionsApi.unsubscribe(targetId);
        setSubscribed(false);
      } else {
        await subscriptionsApi.subscribe(targetId);
        setSubscribed(true);
      }
    } catch (e: any) {
      alert(e?.message || "Action failed");
    } finally {
      setSubLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const targetId = creator?.id || creator?.username || routeValue;
      await messagesApi.startConversation(targetId);
      window.location.href = "/chat";
    } catch {}
  };

  const handlePostLikeChange = useCallback(
    (postId: string | number, liked: boolean, serverCount?: number) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (String(post?.id) !== String(postId)) return post;

          const currentLiked = isPostLiked(post);
          const currentCount = getLikeCount(post);

          let nextCount = currentCount;

          if (typeof serverCount === "number" && !Number.isNaN(serverCount)) {
            nextCount = serverCount;
          } else if (liked && !currentLiked) {
            nextCount = currentCount + 1;
          } else if (!liked && currentLiked) {
            nextCount = Math.max(0, currentCount - 1);
          }

          return {
            ...post,
            is_liked: liked,
            liked,
            has_liked: liked,
            like_count: nextCount,
            likes_count: nextCount,
            total_likes: nextCount,
            likes: nextCount,
          };
        })
      );
    },
    []
  );

  const allMedia = useMemo(() => {
    return posts.flatMap((p: any, postIndex: number) =>
      getPostMedia(p).map((m: any, mediaIndex: number) => ({
        ...m,
        originalUrl: m.url,
        src: mediaUrl(m.url),
        postId: p?.id || `post-${postIndex}`,
        id: `${p?.id || postIndex}-${mediaIndex}`,
      }))
    );
  }, [posts]);

  if (loading) return <Spinner text="Loading profile..." />;

  if (notFound || !creator) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-5xl font-black text-gray-200 mb-3">404</p>
          <p className="text-gray-500 mb-4">Creator not found</p>

          <Link href="/feed" className="text-[#e8125c] text-sm hover:underline">
            ← Go Home
          </Link>
        </div>
      </div>
    );
  }

  const displayName = creator?.display_name || creator?.username || "User";
  const username = creator?.username || "unknown";
  const price = Number(creator?.subscription_price || 0);
  const subCount = Number(creator?.subscribers_count || 0);
  const postsCount = Number(creator?.posts_count || posts.length || 0);
  const mediaCount = Number(creator?.media_count || allMedia.length || 0);

  const avatarSrc =
    !avatarBroken && creator?.avatar ? mediaUrl(creator.avatar) : null;

  const bannerSrc =
    !bannerBroken && creator?.banner ? mediaUrl(creator.banner) : null;

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <div className="relative h-48 overflow-hidden bg-gradient-to-r from-pink-400 via-rose-400 to-red-400">
          {bannerSrc && (
            <img
              src={bannerSrc}
              alt="Cover"
              draggable={false}
              onContextMenu={blockMediaDownload}
              onDragStart={blockMediaDownload}
              className="absolute inset-0 w-full h-full object-cover select-none"
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
              onError={() => setBannerBroken(true)}
            />
          )}

          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="relative bg-white px-6 pt-16 pb-0 shadow-sm">
          <div className="absolute left-6 -top-12 z-10">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                draggable={false}
                onContextMenu={blockMediaDownload}
                onDragStart={blockMediaDownload}
                className="w-24 h-24 rounded-full object-cover object-center border-4 border-white shadow-md bg-white select-none"
                style={{
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                }}
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                {displayName?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex justify-end mb-4">
            <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <Bell size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>

              {creator?.is_verified && (
                <BadgeCheck size={20} className="text-[#e8125c]" />
              )}
            </div>

            <p className="text-sm text-gray-400">@{username}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span>
              <strong className="text-gray-900">{subCount}</strong> Subscribers
            </span>

            <span className="text-gray-200">|</span>

            <span>
              <strong className="text-gray-900">{postsCount}</strong> Posts
            </span>

            <span className="text-gray-200">|</span>

            <span>
              <strong className="text-gray-900">{mediaCount}</strong> Media
            </span>
          </div>

          {creator?.bio && (
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {creator.bio}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={handleStartChat}
              className="flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 transition-colors"
            >
              <MessageCircle size={18} />
              Chat
            </button>

            <Link
              href="/payments"
              className="flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 transition-colors"
            >
              <Wallet size={18} />
              Wallet
            </Link>
          </div>

          {subscribed ? (
            <div className="mb-5">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                >
                  {subLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <BadgeCheck size={18} />
                  )}

                  {subLoading
                    ? "Updating..."
                    : price > 0
                    ? `Subscribed · $${Number(price).toFixed(2)}/mo`
                    : "Subscribed Free"}
                </button>

                <p className="text-xs text-green-700 text-center mt-3 font-medium">
                  You are already subscribed to this creator.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-3">
                <h3 className="font-bold text-gray-900 mb-1">
                  🔓 Unlock Premium Content
                </h3>

                <p className="text-xs text-gray-500 mb-3">
                  Subscribe to get access to exclusive posts, photos, and more.
                </p>

                <button
                  onClick={handleSubscribe}
                  disabled={subLoading}
                  className="w-full py-3 bg-[#e8125c] hover:bg-[#c4104f] text-white font-semibold rounded-xl transition-colors text-sm shadow-sm shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {subLoading && <Loader2 size={16} className="animate-spin" />}

                  {price > 0
                    ? `Subscribe For $${Number(price).toFixed(2)}/Month`
                    : "Subscribe Free"}
                </button>
              </div>
            </div>
          )}

          <div className="flex border-b border-gray-100">
            {(["posts", "media", "about"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === tab
                    ? "text-[#e8125c] border-b-2 border-[#e8125c]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "posts" && <FileText size={15} />}
                {tab === "media" && <ImageIcon size={15} />}
                {tab === "about" && <Grid3X3 size={15} />}

                {tab === "media" ? "Photos" : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-6">
          {activeTab === "posts" &&
            (posts.length > 0 ? (
              posts.map((post, index) => (
                <PostCard
                  key={post?.id || index}
                  post={post}
                  onLikeChange={(liked: boolean, count?: number) =>
                    handlePostLikeChange(post?.id, liked, count)
                  }
                />
              ))
            ) : (
              <p className="text-center text-gray-400 py-12 text-sm">
                No posts yet
              </p>
            ))}

          {activeTab === "media" && (
            <div
              className="select-none"
              onContextMenu={(e) => e.preventDefault()}
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
            >
              {allMedia.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allMedia.map((item: any) => {
                    const relatedPost = posts.find(
                      (p: any) => String(p.id) === String(item.postId)
                    );

                    const isLocked = isPPVPost(relatedPost);
                    const mediaWatermarkText = getWatermarkText();

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl overflow-hidden select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          WebkitUserSelect: "none",
                          userSelect: "none",
                          WebkitTouchCallout: "none",
                        }}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                          {item.type === "video" ? (
                            <>
                              <div
                                className={`w-full h-full relative ${
                                  !isLocked ? "cursor-pointer" : ""
                                }`}
                                onClick={() =>
                                  !isLocked && setSelectedMedia(item)
                                }
                                onContextMenu={(e) => e.preventDefault()}
                              >
                                <video
                                  src={item.src}
                                  className={`w-full h-full object-cover ${
                                    isLocked
                                      ? "blur-xl brightness-75 scale-105"
                                      : ""
                                  }`}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  controls={false}
                                  controlsList="nodownload noplaybackrate"
                                  disablePictureInPicture
                                  onContextMenu={blockMediaDownload}
                                  onDragStart={blockMediaDownload}
                                />

                                {!isLocked && (
                                  <RepeatedWatermark
                                    text={mediaWatermarkText}
                                  />
                                )}
                              </div>

                              {!isLocked && (
                                <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 pointer-events-none z-20">
                                  <Play size={14} />
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <img
                                src={item.src}
                                alt="Creator media"
                                draggable={false}
                                onContextMenu={blockMediaDownload}
                                onDragStart={blockMediaDownload}
                                onMouseDown={(e) => {
                                  if (e.button === 2) blockMediaDownload(e);
                                }}
                                onClick={() =>
                                  !isLocked && setSelectedMedia(item)
                                }
                                className={`w-full h-full object-cover select-none ${
                                  isLocked
                                    ? "blur-xl brightness-75 scale-105"
                                    : "cursor-pointer"
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

                              {!isLocked && (
                                <RepeatedWatermark text={mediaWatermarkText} />
                              )}
                            </>
                          )}

                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                              <div className="bg-white/90 px-3 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                <Lock size={12} />
                                Paid Preview
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12 text-sm">
                  No photos or videos yet
                </div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">About creator</h3>

              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {creator?.bio || "No bio provided."}
              </p>

              <div className="space-y-3">
                {[
                  { label: "ID", value: creator?.id || "-" },
                  {
                    label: "Username",
                    value: creator?.username ? `@${creator.username}` : "-",
                  },
                  {
                    label: "Display Name",
                    value: creator?.display_name || "-",
                  },
                  { label: "Subscribers", value: subCount },
                  { label: "Total Posts", value: postsCount },
                  { label: "Total Media", value: mediaCount },
                  {
                    label: "Subscription Price",
                    value:
                      price > 0 ? `$${Number(price).toFixed(2)}/month` : "Free",
                  },
                  creator?.location
                    ? { label: "Location", value: creator.location }
                    : null,
                  creator?.website
                    ? { label: "Website", value: creator.website }
                    : null,
                ]
                  .filter(Boolean)
                  .map((row: any) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-4"
                    >
                      <span className="text-sm text-gray-500">{row.label}</span>

                      <span className="text-sm font-semibold text-gray-900 text-right break-all">
                        {row.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 select-none"
          onClick={() => setSelectedMedia(null)}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMedia(null);
            }}
            className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>

          <div
            className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              WebkitUserSelect: "none",
              userSelect: "none",
              WebkitTouchCallout: "none",
            }}
          >
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
                className="max-w-full max-h-[90vh] rounded-xl"
              />
            ) : (
              <img
                src={selectedMedia.src}
                alt="Full screen media"
                draggable={false}
                onContextMenu={blockMediaDownload}
                onDragStart={blockMediaDownload}
                onMouseDown={(e) => {
                  if (e.button === 2) blockMediaDownload(e);
                }}
                className="max-w-full max-h-[90vh] object-contain rounded-xl select-none"
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

            <RepeatedWatermark text={getWatermarkText()} />
          </div>
        </div>
      )}
    </>
  );
}