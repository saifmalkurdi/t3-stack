"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Plus, Pencil, Trash2, Heart, Loader2, FileText } from "lucide-react";
import { PostFormModal } from "./post-form-modal";

export function PublisherDashboardClient() {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<{
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    published: boolean;
  } | null>(null);

  const { data: posts, isLoading, refetch } = api.post.getMyPosts.useQuery();

  const deletePost = api.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      void refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this post?")) {
      deletePost.mutate({ id });
    }
  };

  const handleEdit = (post: {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    published: boolean;
  }) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingPost(null);
    void refetch();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-gray-100">
            My Posts
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {posts?.filter((p) => p.published).length ?? 0} published
            {" · "}
            {posts?.filter((p) => !p.published).length ?? 0} drafts
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          New post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : posts?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-500 dark:text-gray-400">
          <FileText className="h-10 w-10" />
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm">Create your first post to get started</p>
          <Button onClick={() => setShowForm(true)} className="mt-2">
            <Plus className="h-4 w-4" />
            Create post
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts?.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{post.title}</CardTitle>
                      <Badge variant={post.published ? "success" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Heart className="h-4 w-4 fill-current text-red-400" />
                      {post._count.likes}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleEdit({
                          id: post.id,
                          title: post.title,
                          content: post.content,
                          imageUrl: post.imageUrl,
                          published: post.published,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(post.id)}
                      disabled={deletePost.isPending}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {post.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <PostFormModal editingPost={editingPost} onClose={handleClose} />
      )}
    </div>
  );
}
