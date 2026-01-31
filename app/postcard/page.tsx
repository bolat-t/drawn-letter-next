"use client";

import PostcardEditor from "@/app/components/Letter/PostcardEditor";
import { ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

export default function PostcardPage() {
    return (
        <div className="min-h-screen bg-[#f5f0e6] flex flex-col relative overflow-hidden">
            {/* Background pattern */}
            <div
                className="absolute inset-0 z-0 opacity-30"
                style={{
                    backgroundImage: "url('/assets/03/BG-66.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 z-10">
                <Link href="/draw">
                    <button className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/60 rounded-full hover:bg-white active:scale-95 transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#3c3c3c]" />
                    </button>
                </Link>
                <h1 className="font-courier text-base sm:text-lg font-bold text-[#3c3c3c] drop-shadow-sm">Create Postcard</h1>
                <Link href="/">
                    <button className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/60 rounded-full hover:bg-white active:scale-95 transition-all shadow-sm">
                        <Home className="w-5 h-5 text-[#3c3c3c]" />
                    </button>
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-start sm:items-center justify-center p-3 sm:p-4 z-10 overflow-auto">
                <PostcardEditor />
            </div>

            {/* Footer */}
            <div className="p-4 text-center z-10">
                <p className="font-courier text-xs text-[#9a9a9a]">
                    Download your postcard or send it to the cloud
                </p>
            </div>
        </div>
    );
}
