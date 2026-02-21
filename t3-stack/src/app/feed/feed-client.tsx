"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Search, Heart, Bookmark, Loader2 } from "lucide-react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function PostCard({
  post,
}: {
  post: {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdAt: Date;
    published: boolean;
    createdBy: { id: string; name: string | null; image: string | null };
    _count: { likes: number };
  };
}) {
  const utils = api.useUtils();
  const { data: likeStatus } = api.like.getStatus.useQuery({ postId: post.id });
  const { data: bookmarkStatus } = api.bookmark.getStatus.useQuery({
    postId: post.id,
  });

  const toggleLike = api.like.toggle.useMutation({
    onSuccess: () => {
      void utils.like.getStatus.invalidate({ postId: post.id });
      void utils.post.getFeed.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleBookmark = api.bookmark.toggle.useMutation({
    onSuccess: (data) => {
      void utils.bookmark.getStatus.invalidate({ postId: post.id });
      void utils.bookmark.getMyBookmarks.invalidate();
      toast.success(data.bookmarked ? "Bookmarked" : "Bookmark removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const liked = likeStatus?.liked ?? false;
  const bookmarked = bookmarkStatus?.bookmarked ?? false;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      {/* Author */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {post.createdBy.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.createdBy.image}
              alt={post.createdBy.name ?? ""}
              className="h-full w-full object-cover"
            />
          ) : (
            (post.createdBy.name ?? "?")[0]?.toUpperCase()
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {post.createdBy.name ?? "Anonymous"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {post.title}
      </h2>
      {post.imageUrl && (
        <div className="mb-3 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.title}
            className="max-h-56 w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <p className="line-clamp-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {post.content}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 ${liked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => toggleLike.mutate({ postId: post.id })}
          disabled={toggleLike.isPending}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{post._count.likes}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 ${bookmarked ? "text-blue-600 hover:text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
          onClick={() => toggleBookmark.mutate({ postId: post.id })}
          disabled={toggleBookmark.isPending}
          title={bookmarked ? "Remove bookmark" : "Bookmark post"}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
        </Button>
      </div>
    </article>
  );
}

export function FeedClient() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.post.getFeed.useInfiniteQuery(
      { limit: 10, search: debouncedSearch || undefined },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
      },
    );

  // Infinite scroll with IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Search */}
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Discovery Feed
        </h1>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search posts..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        {debouncedSearch && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Results for &ldquo;
              <span className="font-medium">{debouncedSearch}</span>&rdquo;
            </p>
            <Badge variant="secondary">{posts.length} found</Badge>
            <button
              onClick={() => setSearchInput("")}
              className="text-xs text-blue-600 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400 dark:text-gray-500">
          <Search className="h-10 w-10" />
          <p className="text-lg font-medium">
            {debouncedSearch ? "No posts match your search" : "No posts yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loadMoreRef} className="mt-6 flex justify-center">
        {isFetchingNextPage && (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}
