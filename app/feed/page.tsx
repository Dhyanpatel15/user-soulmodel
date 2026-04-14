"use client";

import { useEffect, useMemo, useState } from "react";
import { feedApi, subscriptionsApi } from "@/lib/api";
import PostCard from "@/components/PostCard";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import { Users, Globe, LayoutGrid, LucideIcon } from "lucide-react";

type Tab = "all" | "subscribed" | "discover";

type TabItem = {
  key: Tab;
  label: string;
  count: number;
  icon?: LucideIcon;
};

function normalizeCreator(creator: any = {}) {
  return {
    ...creator,
    id: creator?.id ?? creator?.creator_id ?? creator?.user_id ?? null,
    username: creator?.username || creator?.user_name || creator?.handle || "",
    display_name: creator?.display_name || creator?.full_name || creator?.name || creator?.username || "Creator",
    avatar_url: creator?.avatar_url || creator?.avatar || creator?.profile_image || creator?.profile_picture || creator?.image || creator?.user?.avatar_url || creator?.user?.avatar || "",
    is_verified: Boolean(creator?.is_verified || creator?.verified || creator?.user?.is_verified || creator?.user?.verified),
  };
}

function normalizePost(post: any) {
  const creator = normalizeCreator(post?.creator || post?.user || post?.profile || {});
  const price = Number(post?.price || 0);
  const isPPV = Boolean(post?.is_ppv || post?.ppv || post?.is_paid || post?.paid_post || post?.locked || post?.is_locked || post?.visibility === "ppv" || post?.access_type === "ppv" || post?.visibility_type === "ppv" || post?.is_premium || price > 0);
  const isLocked = Boolean(post?.is_locked || post?.locked || post?.visibility === "ppv" || post?.is_premium || price > 0 || isPPV);
  return {
    ...post,
    creator,
    creator_id: post?.creator_id ?? creator?.id ?? post?.user_id ?? null,
    likes_count: Number(post?.likes_count ?? post?.total_likes ?? post?.like_count ?? 0),
    comments_count: Number(post?.comments_count ?? post?.total_comments ?? post?.comment_count ?? 0),
    is_liked: Boolean(post?.is_liked),
    is_bookmarked: Boolean(post?.is_bookmarked),
    price,
    is_ppv: isPPV,
    is_locked: isLocked,
    is_free: !isPPV,
  };
}

function normalizeFeedResponse(response: any) {
  const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : Array.isArray(response?.items) ? response.items : Array.isArray(response?.results) ? response.results : Array.isArray(response?.posts) ? response.posts : [];
  return list.map(normalizePost);
}

export default function FeedPage() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [postsResult, subsResult] = await Promise.allSettled([
          feedApi.getAllCreatorsPosts(),
          subscriptionsApi.getMySubscriptions(),
        ]);
        let posts: any[] = [];
        if (postsResult.status === "fulfilled") {
          posts = normalizeFeedResponse(postsResult.value);
        } else {
          setError(postsResult.reason?.message || "Could not load posts");
        }
        const subIds = new Set<string>();
        if (subsResult.status === "fulfilled") {
          const subsResponse = subsResult.value;
          const list = Array.isArray(subsResponse) ? subsResponse : subsResponse?.data || subsResponse?.items || subsResponse?.results || [];
          list.forEach((s: any) => {
            const id = s?.creator?.id || s?.creator_id || s?.id;
            if (id) subIds.add(String(id));
          });
        }
        posts.sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime());
        setAllPosts(posts);
        setSubscribedIds(subIds);
      } catch (e: any) {
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isSubPost = (post: any) => subscribedIds.has(String(post?.creator?.id || post?.creator_id || ""));
  const subscribedPosts = useMemo(() => allPosts.filter(isSubPost), [allPosts, subscribedIds]);
  const discoverPosts = useMemo(() => allPosts.filter((p) => !isSubPost(p)), [allPosts, subscribedIds]);

  const tabs: TabItem[] = [
    { key: "all", label: "All", count: allPosts.length, icon: LayoutGrid },
    { key: "subscribed", label: "Following", count: subscribedPosts.length, icon: Users },
    { key: "discover", label: "Discover", count: discoverPosts.length, icon: Globe },
  ];

  const EmptyState = ({ type }: { type: "subscribed" | "empty" }) => (
    <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-100 shadow-sm">
      {type === "subscribed" ? (
        <>
          <Users size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-600 text-sm">No posts from your subscriptions</p>
          <p className="text-xs text-gray-400 mt-1">Subscribe to creators to see their posts here</p>
        </>
      ) : (
        <>
          <Globe size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-600 text-sm">No posts found</p>
        </>
      )}
    </div>
  );

  const renderPosts = (posts: any[], prefix = "") =>
    posts.map((p) => <PostCard key={`${prefix}${p.id}`} post={p} />);

  return (
    <div className="max-w-2xl mx-auto px-3 md:px-4 py-5 md:py-8">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">Feed</h1>
      <p className="text-gray-500 text-xs md:text-sm mb-4">Posts from all creators</p>

      {/* Tabs - scrollable on mobile */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                tab === tabItem.key
                  ? "bg-[#e8125c] text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-[#e8125c] hover:text-[#e8125c]"
              }`}
            >
              {Icon && <Icon size={13} />}
              {tabItem.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === tabItem.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                {tabItem.count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Spinner text="Loading feed..." />
      ) : error && allPosts.length === 0 ? (
        <ErrorMessage message={error} />
      ) : tab === "subscribed" ? (
        subscribedPosts.length === 0 ? <EmptyState type="subscribed" /> : renderPosts(subscribedPosts, "sub-")
      ) : tab === "discover" ? (
        discoverPosts.length === 0 ? <EmptyState type="empty" /> : renderPosts(discoverPosts, "dis-")
      ) : allPosts.length === 0 ? (
        <EmptyState type="empty" />
      ) : (
        <>
          {subscribedPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Users size={12} className="text-[#e8125c]" />
                <span className="text-[10px] font-semibold text-[#e8125c] uppercase tracking-wider">Following</span>
                <div className="flex-1 h-px bg-pink-100" />
              </div>
              {renderPosts(subscribedPosts, "sub-")}
            </>
          )}
          {discoverPosts.length > 0 && (
            <>
              <div className="flex items-center gap-2 my-3">
                <Globe size={12} className="text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Discover</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {renderPosts(discoverPosts, "dis-")}
            </>
          )}
        </>
      )}
    </div>
  );
}