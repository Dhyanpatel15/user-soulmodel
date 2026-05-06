"use client";

import { useEffect, useState } from "react";
import { bookmarksApi } from "@/lib/api";
import PostCard from "@/components/PostCard";
import Spinner from "@/components/Spinner";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const data = await bookmarksApi.getBookmarks();
        setPosts(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load bookmarks");
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Bookmarks</h1>
      <p className="text-gray-500 text-sm mb-8">You haven&apos;t bookmarked anything yet.</p>

      {loading ? (
        <Spinner text="Loading bookmarks..." />
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bookmark size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="font-medium text-gray-500">No bookmarks yet</p>
          <p className="text-sm mt-1">
            Tap the bookmark icon on any post to save it here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}