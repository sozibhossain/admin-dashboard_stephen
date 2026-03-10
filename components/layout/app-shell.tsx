"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#020202] text-white">
      {/* Desktop Sidebar - Fixed Width */}
      <aside className="hidden w-[300px] flex-col border-r border-white/10 lg:flex">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Fixed Height */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/40 px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="rounded-md border border-white/30 p-2 lg:hidden" 
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-[#1f2930] text-base font-bold">
            {getInitials(data?.user?.name)}
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setOpen(false)} 
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-72 bg-[#020202] shadow-xl transition-transform">
            <Sidebar mobile onNav={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}