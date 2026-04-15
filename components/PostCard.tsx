"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Lock,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Send,
  Play,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { interactApi, mediaUrl, browseApi } from "@/lib/api";

interface Post {
  id: string | number;
  creator?: any;
  creator_id?: string | number;
  user_id?: string | number;
  title?: string;
  caption?: string;
  content?: string;
  description?: string;
  text?: string;
  media?: any[];
  images?: string[];
  thumbnail?: string;
  likes_count?: number;
  like_count?: number;
  total_likes?: number;
  comments_count?: number;
  comment_count?: number;
  is_liked?: boolean;
  liked?: boolean;
  has_liked?: boolean;
  is_bookmarked?: boolean;
  is_free?: boolean;
  is_locked?: boolean;
  is_ppv?: boolean;
  ppv?: boolean;
  is_paid?: boolean;
  paid_post?: boolean;
  created_at?: string;
  [key: string]: any;
}

type PostCardProps = {
  post: Post;
  onLikeChange?: (liked: boolean, count?: number) => void;
};

function getSafeNumber(...values: any[]): number {
  for (const value of values) {
    const num = Number(value);
    if (!Number.isNaN(num) && Number.isFinite(num)) return num;
  }
  return 0;
}

function getOptionalNumber(...values: any[]): number | undefined {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const num = Number(value);
    if (!Number.isNaN(num) && Number.isFinite(num)) return num;
  }
  return undefined;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
}

function getMediaItems(post: any) {
  const mediaItems: { url: string; type: "image" | "video" }[] = [];
  const seen = new Set<string>();
  const visited = new WeakSet();

  const pushMedia = (rawUrl: any, rawType?: any) => {
    if (!rawUrl || typeof rawUrl !== "string") return;

    const cleanUrl = rawUrl.trim();
    if (!cleanUrl) return;

    const lowerType = String(rawType || "").toLowerCase();

    const isVideo =
      lowerType.includes("video") ||
      /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(cleanUrl);

    const isImage =
      /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)$/i.test(cleanUrl) ||
      cleanUrl.includes("/media/") ||
      cleanUrl.includes("/uploads/") ||
      cleanUrl.includes("/images/") ||
      cleanUrl.startsWith("media/") ||
      cleanUrl.startsWith("uploads/");

    if (!isVideo && !isImage) return;

    const item = {
      url: cleanUrl,
      type: (isVideo ? "video" : "image") as "image" | "video",
    };

    const key = `${item.type}:${item.url}`;
    if (seen.has(key)) return;

    seen.add(key);
    mediaItems.push(item);
  };

  const scan = (value: any) => {
    if (!value) return;

    if (typeof value === "string") {
      pushMedia(value);
      return;
    }

    if (typeof value !== "object") return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(scan);
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
        pushMedia(value[key], value.type || value.media_type || key);
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
          pushMedia(val, lowerKey);
        } else {
          scan(val);
        }
      }
    });

    Object.values(value).forEach((val) => {
      if (typeof val === "object") {
        scan(val);
      }
    });
  };

  scan(post);
  return mediaItems;
}

function normalizeCommentUI(comment: any = {}) {
  const user = comment?.user || comment?.creator || comment?.author || {};

  return {
    ...comment,
    id: comment?.id ?? comment?.comment_id ?? `${Date.now()}-${Math.random()}`,
    content:
      comment?.content ||
      comment?.text ||
      comment?.comment ||
      comment?.body ||
      comment?.message ||
      "",
    created_at: comment?.created_at || comment?.createdAt || null,
    user: {
      id: user?.id ?? comment?.user_id ?? null,
      username:
        user?.username ||
        user?.user_name ||
        user?.handle ||
        comment?.username ||
        "User",
      display_name:
        user?.display_name ||
        user?.full_name ||
        user?.name ||
        user?.username ||
        comment?.username ||
        "User",
      avatar_url:
        user?.avatar_url ||
        user?.avatar ||
        user?.profile_image ||
        user?.profile_picture ||
        "",
    },
  };
}

export default function PostCard({ post, onLikeChange }: PostCardProps) {
  const router = useRouter();

  const [liked, setLiked] = useState(
    Boolean(post.is_liked ?? post.liked ?? post.has_liked ?? false)
  );
  const [bookmarked, setBookmarked] = useState(Boolean(post.is_bookmarked));
  const [likesCount, setLikesCount] = useState(
    getSafeNumber(post.likes_count, post.like_count, post.total_likes, 0)
  );
  const [commentsCount, setCommentsCount] = useState(
    getSafeNumber(post.comments_count, post.comment_count, 0)
  );

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const [likeLoading, setLikeLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    setLiked(Boolean(post.is_liked ?? post.liked ?? post.has_liked ?? false));
    setBookmarked(Boolean(post.is_bookmarked));
    setLikesCount(
      getSafeNumber(post.likes_count, post.like_count, post.total_likes, 0)
    );
    setCommentsCount(getSafeNumber(post.comments_count, post.comment_count, 0));
  }, [post]);

  const creator = post.creator || post.user || post.profile || {};
  const creatorId = creator.id || post.creator_id || post.user_id;
  const creatorUsername =
    creator.username || creator.user_name || creator.handle || "";
  const creatorDisplayName =
    creator.display_name ||
    creator.full_name ||
    creator.name ||
    creatorUsername ||
    "Creator";

  const creatorAvatar =
    creator.avatar_url ||
    creator.avatar ||
    creator.profile_image ||
    creator.profile_picture ||
    creator.image ||
    "";

  const creatorVerified = Boolean(creator.is_verified || creator.verified);

  const isLocked =
    Boolean(post.is_locked) ||
    Boolean(post.is_ppv) ||
    Boolean(post.ppv) ||
    Boolean(post.is_paid) ||
    Boolean(post.paid_post) ||
    (!post.is_free && post.is_free !== undefined);

  const mediaItems = useMemo(() => getMediaItems(post), [post]);
  const firstMedia = mediaItems[0];
  const activeMedia = mediaItems[viewerIndex];

  const postCaption =
    post.caption ||
    post.content ||
    post.description ||
    post.text ||
    "";

  const openCreator = () => {
    if (!creatorId) return;
    router.push(`/user/${creatorId}`);
  };

  const openViewer = (index = 0) => {
    if (!mediaItems.length) return;
    setViewerIndex(index);
    setShowViewer(true);
  };

  const closeViewer = () => {
    setShowViewer(false);
  };

  const showPrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setViewerIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const showNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setViewerIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const refreshPostCounts = async () => {
    if (!post?.id || !creatorId) return;

    try {
      const fresh: any = await browseApi.getPost(post.id, creatorId);
      const source = fresh?.data || fresh || {};
      const postSource = source?.post || {};

      const freshLikeCount = getSafeNumber(
        source?.likes_count,
        source?.like_count,
        source?.total_likes,
        postSource?.likes_count,
        postSource?.like_count,
        postSource?.total_likes,
        0
      );

      const freshCommentCount = getSafeNumber(
        source?.comments_count,
        source?.comment_count,
        postSource?.comments_count,
        postSource?.comment_count,
        0
      );

      const freshLiked =
        source?.is_liked ??
        source?.liked ??
        postSource?.is_liked ??
        postSource?.liked;

      setLikesCount(freshLikeCount);
      setCommentsCount(freshCommentCount);

      if (freshLiked !== undefined) {
        setLiked(Boolean(freshLiked));
        onLikeChange?.(Boolean(freshLiked), freshLikeCount);
      } else {
        onLikeChange?.(liked, freshLikeCount);
      }
    } catch (error) {
      console.error("Failed to refresh post counts", error);
    }
  };

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.stopPropagation();
  if (likeLoading) return;

  const prevLiked = liked;
  const prevLikesCount = likesCount;

  const optimisticLiked = !prevLiked;
  const optimisticCount = optimisticLiked
    ? prevLikesCount + 1
    : Math.max(0, prevLikesCount - 1);

  // instant UI update
  setLiked(optimisticLiked);
  setLikesCount(optimisticCount);
  onLikeChange?.(optimisticLiked, optimisticCount);
  setLikeLoading(true);

  try {
    const res: any = await interactApi.toggleLike(post.id);

    const finalLiked =
      typeof res?.liked === "boolean" ? res.liked : optimisticLiked;

    const serverCount =
      typeof res?.likes_count === "number" &&
      Number.isFinite(res.likes_count)
        ? res.likes_count
        : undefined;

    setLiked(finalLiked);

    if (serverCount !== undefined) {
      setLikesCount(serverCount);
      onLikeChange?.(finalLiked, serverCount);
    } else {
      setLikesCount(optimisticCount);
      onLikeChange?.(finalLiked, optimisticCount);

      // fallback sync from latest post data if backend did not return count
      setTimeout(() => {
        refreshPostCounts();
      }, 250);
    }
  } catch (error) {
    console.error("Like failed", error);

    // rollback on error
    setLiked(prevLiked);
    setLikesCount(prevLikesCount);
    onLikeChange?.(prevLiked, prevLikesCount);
  } finally {
    setLikeLoading(false);
  }
};

  const handleBookmark = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (bookmarkLoading || !creatorId) return;

    const prev = bookmarked;
    setBookmarked(!prev);
    setBookmarkLoading(true);

    try {
      const res: any = await interactApi.toggleBookmark(post.id, creatorId);

      const next =
        res?.is_bookmarked ??
        res?.bookmarked ??
        res?.data?.is_bookmarked ??
        res?.data?.bookmarked;

      if (next !== undefined) {
        setBookmarked(Boolean(next));
      }
    } catch (err: any) {
      console.error("Bookmark failed", err);
      setBookmarked(prev);
      alert(err?.message || "Bookmark failed");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const toggleComments = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!commentsLoaded) {
      setCommentsLoading(true);

      try {
        const data: any = await interactApi.getComments(post.id);
        const list = Array.isArray(data?.comments) ? data.comments : [];

        setComments(list.map(normalizeCommentUI));
        setCommentsLoaded(true);

        setCommentsCount(
          getSafeNumber(data?.comments_count, data?.comment_count, list.length)
        );
      } catch (error) {
        console.error("Load comments failed", error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }

    setShowComments((prev) => !prev);
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || commentSubmitting) return;

    setCommentSubmitting(true);

    try {
      const res: any = await interactApi.createComment(post.id, text);

      if (res?.comment) {
        setComments((prev) => [...prev, normalizeCommentUI(res.comment)]);
        setCommentsCount((prev) =>
          getSafeNumber(res?.comments_count, res?.comment_count, prev + 1)
        );
      } else {
        const freshComments: any = await interactApi.getComments(post.id);
        const list = Array.isArray(freshComments?.comments)
          ? freshComments.comments
          : [];

        setComments(list.map(normalizeCommentUI));
        setCommentsCount(
          getSafeNumber(
            freshComments?.comments_count,
            freshComments?.comment_count,
            list.length
          )
        );
      }

      setCommentText("");
      setCommentsLoaded(true);
      setShowComments(true);
    } catch (error) {
      console.error("Create comment failed", error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={openCreator}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 cursor-pointer"
      >
        <div className="flex items-center gap-3 p-4">
          <Link
            href={creatorId ? `/user/${creatorId}` : "#"}
            onClick={(e) => e.stopPropagation()}
          >
            {creatorAvatar ? (
              <img
                src={mediaUrl(creatorAvatar)}
                alt={creatorDisplayName}
                className="w-11 h-11 rounded-full object-cover border-2 border-pink-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center text-[#e8125c] font-bold text-sm">
                {creatorDisplayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </Link>

          <div className="flex-1">
            <Link
              href={creatorId ? `/user/${creatorId}` : "#"}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5"
            >
              <span className="font-semibold text-gray-900 text-sm hover:text-[#e8125c] transition-colors">
                {creatorDisplayName}
              </span>
              {creatorVerified && (
                <BadgeCheck size={15} className="text-[#e8125c]" />
              )}
            </Link>

            <p className="text-xs text-gray-400">
              {creatorUsername ? `@${creatorUsername}` : ""}
              {timeAgo(post.created_at) ? ` · ${timeAgo(post.created_at)}` : ""}
            </p>
          </div>
        </div>

        {(post.title || postCaption) && (
          <div className="px-4 pb-3">
            {post.title && (
              <p className="font-semibold text-gray-900 text-sm mb-1">
                {post.title}
              </p>
            )}

            {postCaption && (
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line break-words">
                {postCaption}
              </p>
            )}
          </div>
        )}

        {firstMedia && (
          <div className="relative overflow-hidden">
            {firstMedia.type === "video" ? (
              <>
                <video
                  src={mediaUrl(firstMedia.url)}
                  className={`w-full object-cover max-h-96 ${
                    isLocked ? "blur-xl brightness-75 scale-105" : ""
                  }`}
                  controls={!isLocked}
                  muted
                  playsInline
                  preload="metadata"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isLocked) {
                      openCreator();
                      return;
                    }
                    openViewer(0);
                  }}
                />
                {!isLocked && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                    <Play size={14} />
                  </div>
                )}
              </>
            ) : (
              <img
                src={mediaUrl(firstMedia.url)}
                alt="Post media"
                className={`w-full object-cover max-h-96 ${
                  isLocked ? "blur-xl brightness-75 scale-105" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLocked) {
                    openCreator();
                    return;
                  }
                  openViewer(0);
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
            )}

            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                <div className="bg-black/35 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <Lock size={32} className="mx-auto mb-2" />
                  <p className="font-semibold text-sm">Paid Post Preview</p>
                  <p className="text-xs text-white/85 mt-1">
                    Subscribe to unlock this content
                  </p>
                </div>
              </div>
            )}

            {mediaItems.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                +{mediaItems.length - 1}
              </div>
            )}
          </div>
        )}

        <div
          className="flex items-center gap-1 px-4 py-3 border-t border-gray-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
              liked
                ? "text-[#e8125c] bg-pink-50"
                : "text-gray-500 hover:bg-gray-50"
            } disabled:opacity-60`}
          >
            <Heart size={17} className={liked ? "fill-[#e8125c]" : ""} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={toggleComments}
            disabled={commentsLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
              showComments
                ? "text-blue-500 bg-blue-50"
                : "text-gray-500 hover:bg-gray-50"
            } disabled:opacity-60`}
          >
            <MessageCircle size={17} />
            <span>{commentsCount}</span>
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className="flex-1" />

          <button
            onClick={handleBookmark}
            disabled={bookmarkLoading}
            className={`p-2 rounded-xl transition-all ${
              bookmarked
                ? "text-[#e8125c] bg-pink-50"
                : "text-gray-400 hover:bg-gray-50"
            } disabled:opacity-60`}
          >
            <Bookmark size={17} className={bookmarked ? "fill-[#e8125c]" : ""} />
          </button>
        </div>

        {showComments && (
          <div
            className="border-t border-gray-50 px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            {commentsLoading ? (
              <p className="text-xs text-gray-400 text-center py-2">
                Loading comments...
              </p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                No comments yet. Be the first!
              </p>
            ) : (
              <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                {comments.map((c: any, index: number) => (
                  <div key={c.id || index} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {(c.user?.username || "U").slice(0, 1).toUpperCase()}
                    </div>

                    <div className="bg-gray-50 rounded-xl px-3 py-2 flex-1">
                      <p className="text-xs font-semibold text-gray-700">
                        {c.user?.display_name || c.user?.username || "User"}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="Write a comment..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e8125c] transition-colors"
              />
              <button
                onClick={submitComment}
                disabled={commentSubmitting}
                className="p-2 bg-[#e8125c] rounded-xl hover:bg-[#c4104f] transition-colors disabled:opacity-60"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showViewer && activeMedia && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeViewer}
        >
          <button
            className="absolute top-4 right-4 z-10 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              closeViewer();
            }}
          >
            <X size={22} />
          </button>

          {mediaItems.length > 1 && (
            <>
              <button
                className="absolute left-4 z-10 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
                onClick={showPrevMedia}
              >
                <ChevronLeft size={28} />
              </button>

              <button
                className="absolute right-4 z-10 text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors"
                onClick={showNextMedia}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div
            className="w-full h-full flex items-center justify-center px-4 py-10"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia.type === "video" ? (
              <video
                src={mediaUrl(activeMedia.url)}
                controls
                autoPlay
                className="max-w-[95vw] max-h-[90vh] rounded-xl"
              />
            ) : (
              <img
                src={mediaUrl(activeMedia.url)}
                alt="Full preview"
                className="max-w-[95vw] max-h-[90vh] object-contain rounded-xl"
              />
            )}
          </div>

          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
              {viewerIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}