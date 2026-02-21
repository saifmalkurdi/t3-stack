"use client";

import { useEffect, useRef, useCallback } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Heart, Bookmark, Loader2 } from "lucide-react";

function BookmarkedPostCard({
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

  const toggleLike = api.like.toggle.useMutation({
    onSuccess: () => {
      void utils.like.getStatus.invalidate({ postId: post.id });
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleBookmark = api.bookmark.toggle.useMutation({
    onSuccess: () => {
      void utils.bookmark.getMyBookmarks.invalidate();
      toast.success("Bookmark removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const liked = likeStatus?.liked ?? false;

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
          className="gap-1.5 text-blue-600 hover:text-red-500"
          onClick={() => toggleBookmark.mutate({ postId: post.id })}
          disabled={toggleBookmark.isPending}
          title="Remove bookmark"
        >
          <Bookmark className="h-4 w-4 fill-current" />
        </Button>
      </div>
    </article>
  );
}

export function BookmarksClient() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.bookmark.getMyBookmarks.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
      },
    );

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
      <div className="mb-6">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          <Bookmark className="h-6 w-6 fill-blue-600 text-blue-600" />
          Bookmarks
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Posts you&apos;ve saved for later
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
          <Bookmark className="h-10 w-10" />
          <p className="text-lg font-medium">No bookmarks yet</p>
          <p className="text-sm">
            Tap the bookmark icon on any post to save it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <BookmarkedPostCard key={post.id} post={post} />
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
