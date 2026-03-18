"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { FolderOpen, LayoutDashboard, LogOut, Settings, UserPlus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/managers", label: "Manager's", icon: UserPlus },
  { href: "/financials", label: "Financials", icon: Wallet },
];

export function Sidebar({ mobile = false, onNav }: { mobile?: boolean; onNav?: () => void }) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <aside className={cn("flex h-full w-full flex-col bg-[#111f26] px-5 py-6", mobile ? "border-r border-white/10" : "")}> 
      <div className="mb-8 flex items-center justify-center">
        {!logoError ? (
          <Image
            src="/logo.png"
            alt="NF logo"
            width={110}
            height={78}
            unoptimized
            className="h-[65px] w-auto object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="font-clash text-white">Logo</span>
        )}
      </div>

      <nav className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={cn(
                "text-body-16 flex h-10 items-center gap-3 rounded-lg border px-4",
                active
                  ? "border-white bg-[#d5d2c8] text-[#171717]"
                  : "border-[#d9d9d9] text-[#f2f2f2] hover:bg-white/10",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Link
          href="/settings"
          onClick={onNav}
          className={cn(
            "text-body-16 flex h-10 items-center gap-3 rounded-lg border px-4",
            pathname === "/settings"
              ? "border-white bg-[#d5d2c8] text-[#171717]"
              : "border-[#d9d9d9] text-[#f2f2f2] hover:bg-white/10",
          )}
        >
          <Settings className="h-5 w-5" />
          Setting
        </Link>

        <button
          type="button"
          className="text-body-16 flex h-10 w-full items-center gap-3 rounded-lg bg-[#ff1a11] px-4 text-white"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLogoutOpen(false)}>
              No
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
