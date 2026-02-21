"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { X, Loader2, ImagePlus, Link2, Upload, Trash2 } from "lucide-react";

interface PostFormModalProps {
  editingPost: {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    published: boolean;
  } | null;
  onClose: () => void;
}

export function PostFormModal({ editingPost, onClose }: PostFormModalProps) {
  const [form, setForm] = useState({
    title: editingPost?.title ?? "",
    content: editingPost?.content ?? "",
    imageUrl: editingPost?.imageUrl ?? "",
    published: editingPost?.published ?? true,
  });
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [imagePreview, setImagePreview] = useState<string>(
    editingPost?.imageUrl ?? "",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingPost) {
      setForm({
        title: editingPost.title,
        content: editingPost.content,
        imageUrl: editingPost.imageUrl ?? "",
        published: editingPost.published,
      });
      setImagePreview(editingPost.imageUrl ?? "");
    }
  }, [editingPost]);

  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      toast.success("Post created!");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePost = api.post.update.useMutation({
    onSuccess: () => {
      toast.success("Post updated!");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createPost.isPending || updatePost.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setForm((f) => ({ ...f, imageUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    setForm((f) => ({ ...f, imageUrl: url }));
    setImagePreview(url);
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, imageUrl: "" }));
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrlValue = form.imageUrl.trim() || null;
    if (editingPost) {
      updatePost.mutate({
        id: editingPost.id,
        title: form.title,
        content: form.content,
        imageUrl: imageUrlValue,
        published: form.published,
      });
    } else {
      createPost.mutate({
        title: form.title,
        content: form.content,
        imageUrl: imageUrlValue ?? undefined,
        published: form.published,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="my-4 w-full max-w-lg rounded-xl bg-white shadow-xl sm:my-0 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700">
          <h2 className="text-base font-semibold sm:text-lg">
            {editingPost ? "Edit post" : "New post"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-4 sm:p-6"
        >
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Post title..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your post..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-[160px] sm:min-h-[200px]"
              required
            />
          </div>

          {/* Photo section */}
          <div className="flex flex-col gap-2">
            <Label>Cover photo (optional)</Label>

            {/* Mode tabs */}
            <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setImageMode("url")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  imageMode === "url"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode("upload")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                  imageMode === "upload"
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload file
              </button>
            </div>

            {/* URL input */}
            {imageMode === "url" && (
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
            )}

            {/* File input */}
            {imageMode === "upload" && (
              <div
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-950"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to select an image
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  PNG, JPG, GIF · max 5 MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Preview */}
            {imagePreview && (
              <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 w-full object-cover"
                  onError={() => setImagePreview("")}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Published checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="published"
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm({ ...form, published: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <Label htmlFor="published" className="cursor-pointer">
              Publish immediately
            </Label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingPost ? "Save changes" : "Publish post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
