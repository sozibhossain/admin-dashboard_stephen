"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const category = String(formData.get("category") || "construction");

    const result = await signIn("credentials", {
      email,
      password,
      category,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Invalid credentials or unauthorized category. Use construction admin account.");
      return;
    }

    toast.success("Login successful");
    router.push("/dashboard");
  }

  return (
    <Card className="w-full max-w-3xl border-none bg-[#ececec] p-8 text-black md:p-10">
      <h1 className="text-heading-40">Log In</h1>
      <p className="text-body-16 mb-8 mt-2 text-black/80">Access your account to Continue your learning journey.</p>

      <form action={onSubmit} className="space-y-5">
        <input type="hidden" name="category" value="construction" />

        <div>
          <Label className="text-black">Email Address</Label>
          <Input name="email" type="email" placeholder="you@example.com" className="border-black/40 bg-white text-black" required />
        </div>

        <div>
          <Label className="text-black">Password</Label>
          <div className="relative">
            <Input
              name="password"
              type={show ? "text" : "password"}
              placeholder="********"
              className="border-black/40 bg-white pr-10 text-black"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-black/70"
              onClick={() => setShow((prev) => !prev)}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="text-body-16 flex items-center justify-end">
          <Link href="/forgot-password" className="font-medium text-[#7c6321] underline">
            Forgot password?
          </Link>
        </div>

        <Button className="h-12 w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Card>
  );
}
