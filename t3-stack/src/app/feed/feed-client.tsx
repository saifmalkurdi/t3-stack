"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { api, type RouterOutputs } from "~/trpc/react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Search, Heart, Bookmark, Loader2, RefreshCw } from "lucide-react";

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
  const queryClient = useQueryClient();
  const { data: likeStatus } = api.like.getStatus.useQuery({ postId: post.id });
  const { data: bookmarkStatus } = api.bookmark.getStatus.useQuery({
    postId: post.id,
  });

  const [localCount, setLocalCount] = useState(post._count.likes);
  const likePendingRef = useRef(false);

  useEffect(() => {
    if (!likePendingRef.current) setLocalCount(post._count.likes);
  }, [post._count.likes]);

  const toggleLike = api.like.toggle.useMutation({
    onMutate: async ({ postId }) => {
      likePendingRef.current = true;
      // Cancel ALL in-flight feed requests so they don't overwrite the optimistic update
      await utils.post.getFeed.cancel();
      await utils.like.getStatus.cancel({ postId });
      await utils.post.getMyPosts.cancel();
      const prev = utils.like.getStatus.getData({ postId });
      const delta = prev?.liked ? -1 : 1;
      utils.like.getStatus.setData({ postId }, { liked: !prev?.liked });
      // Optimistically update feed cache so post._count.likes moves instantly
      queryClient.setQueriesData<InfiniteData<RouterOutputs["post"]["getFeed"]>>(
        { queryKey: [["post", "getFeed"]] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === postId
                  ? { ...item, _count: { ...item._count, likes: item._count.likes + delta } }
                  : item,
              ),
            })),
          };
        },
      );
      // Optimistically update publisher dashboard cache
      const prevMyPosts = utils.post.getMyPosts.getData();
      utils.post.getMyPosts.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === postId
            ? { ...p, _count: { ...p._count, likes: p._count.likes + delta } }
            : p,
        );
      });
      setLocalCount((c) => c + delta);
      return { prev, delta, prevMyPosts };
    },
    onError: (err, { postId }, ctx) => {
      utils.like.getStatus.setData({ postId }, ctx?.prev);
      // Revert the feed cache optimistic update
      queryClient.setQueriesData<InfiniteData<RouterOutputs["post"]["getFeed"]>>(
        { queryKey: [["post", "getFeed"]] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === postId
                  ? { ...item, _count: { ...item._count, likes: item._count.likes - (ctx?.delta ?? 0) } }
                  : item,
              ),
            })),
          };
        },
      );
      // Revert publisher dashboard cache
      utils.post.getMyPosts.setData(undefined, ctx?.prevMyPosts);
      setLocalCount((c) => c - (ctx?.delta ?? 0));
      toast.error(err.message);
    },
    onSettled: (_, __, { postId }) => {
      likePendingRef.current = false;
      void utils.like.getStatus.invalidate({ postId });
      void utils.post.getFeed.invalidate();
      void utils.post.getMyPosts.invalidate();
    },
  });

  const toggleBookmark = api.bookmark.toggle.useMutation({
    onMutate: async ({ postId }) => {
      await utils.bookmark.getStatus.cancel({ postId });
      const prev = utils.bookmark.getStatus.getData({ postId });
      utils.bookmark.getStatus.setData({ postId }, { bookmarked: !prev?.bookmarked });
      return { prev };
    },
    onError: (err, { postId }, ctx) => {
      utils.bookmark.getStatus.setData({ postId }, ctx?.prev);
      toast.error(err.message);
    },
    onSettled: (data, _, { postId }) => {
      void utils.bookmark.getStatus.invalidate({ postId });
      void utils.bookmark.getMyBookmarks.invalidate();
      if (data) toast.success(data.bookmarked ? "Bookmarked" : "Bookmark removed");
    },
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
          <span>{localCount}</span>
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
  // Track the post id that was at the top when feed last loaded
  const seenLatestIdRef = useRef<number | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const utils = api.useUtils();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.post.getFeed.useInfiniteQuery(
      { limit: 10, search: debouncedSearch || undefined },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
      },
    );

  // Seed the baseline id once the feed first loads
  useEffect(() => {
    const firstId = data?.pages[0]?.items[0]?.id;
    if (firstId !== undefined && seenLatestIdRef.current === null) {
      seenLatestIdRef.current = firstId;
    }
  }, [data]);

  // Poll for new posts every 30 seconds
  const { data: latestPostData } = api.post.getLatestPostId.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const latestId = latestPostData?.latestId ?? null;
    if (
      latestId !== null &&
      seenLatestIdRef.current !== null &&
      latestId > seenLatestIdRef.current
    ) {
      setHasNewPosts(true);
    }
  }, [latestPostData]);

  const handleReload = async () => {
    setHasNewPosts(false);
    await utils.post.getFeed.invalidate();
    // After refetch the topmost id becomes the new baseline
    seenLatestIdRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      {/* New-posts banner */}
      {hasNewPosts && (
        <div className="sticky top-16 z-10 mb-4">
          <button
            onClick={() => void handleReload()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-blue-700 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            New posts available — click to reload
          </button>
        </div>
      )}

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
