"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { ChevronLeft, Upload, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createManager } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

export default function AddManagerPage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createManager,
    onSuccess: () => {
      toast.success("Manager added successfully");
      router.push("/managers");
    },
    onError: (error) => toast.error(error.message),
  });

  async function onSubmit(formData: FormData) {
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      toast.error("Password and confirm password do not match");
      return;
    }

    formData.delete("confirmPassword");
    mutation.mutate(formData);
  }

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return previewUrl;
    });
  };

  const clearAvatarSelection = () => {
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <Link href="/managers" className="text-heading-40 inline-flex items-center gap-2">
        <ChevronLeft className="h-6 w-6" /> Add Manager&apos;s
      </Link>
      <p className="text-body-16 text-white/80">Create and manage your Mange Manager&apos;s</p>

      <form action={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Manager Name</Label>
            <Input name="name" placeholder="Enter project manager name" required />
          </div>
          <div>
            <Label>Image</Label>
            <div className="mt-2 rounded-lg border border-dashed border-white/50 p-6 text-center">
              {avatarPreview ? (
                <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-lg border border-white/30">
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarPreview})` }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                    onClick={clearAvatarSelection}
                    aria-label="Remove selected image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Label htmlFor="avatar" className="cursor-pointer text-body-16">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-[#6d63d7]" />
                  Upload Photo
                  <p className="text-body-16 text-white/70">png,jpeg,jpg</p>
                </Label>
              )}
              <Input
                ref={avatarInputRef}
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Category</Label>
          <Select name="category" defaultValue="construction" className="mt-2" required>
            <option value="construction">Construction</option>
            <option value="interior">Interior</option>
          </Select>
        </div>

        <div>
          <Label>Enter Email</Label>
          <Input name="email" type="email" placeholder="Enter Email" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" placeholder="**********" required />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input name="confirmPassword" type="password" placeholder="**********" required />
          </div>
        </div>

        <div className="grid gap-4 pt-2 md:grid-cols-2">
          <Link href="/managers">
            <Button type="button" variant="outline" className="h-12 w-full">
              Cancel
            </Button>
          </Link>
          <Button className="h-12" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Manager"}
          </Button>
        </div>
      </form>
    </div>
  );
}
