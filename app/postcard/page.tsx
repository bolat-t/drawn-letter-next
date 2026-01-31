"use client";

import PostcardEditor from "@/app/components/Letter/PostcardEditor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PostcardPage() {
    return (
        <div className="min-h-screen bg-[#f5f0e6] flex flex-col p-4">
            <div className="mb-6">
                <Link href="/draw">
                    <button className="flex items-center gap-2 p-2 px-4 bg-white/50 rounded-full hover:bg-white transition-colors text-[#3c3c3c]">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-courier">Back to Drawing</span>
                    </button>
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <PostcardEditor />
            </div>
        </div>
    );
}
