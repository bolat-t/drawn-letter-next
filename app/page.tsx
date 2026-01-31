"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import WelcomeModal from "@/app/components/WelcomeModal";

export default function Home() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleStampClick = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleStart = () => {
    setShowModal(false);
    router.push("/draw");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#f5f0e6]">
      {/* Background Texture */}
      <div
        className="absolute inset-0 z-0 opacity-100 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: "url('/assets/01_index/bg-01.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="z-10 flex flex-col items-center gap-12 mt-[-5vh]">

        {/* Main Interaction: The Stamp */}
        <button
          onClick={handleStampClick}
          className="relative group cursor-pointer bg-transparent border-none"
          aria-label="Open welcome modal"
        >
          <div className="relative transition-all duration-500 ease-in-out transform group-hover:scale-110 group-hover:-rotate-3 group-active:scale-95">
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 rounded-full blur-xl transition-all duration-500" />
            <Image
              src="/assets/01_index/hover-title-text.png"
              alt="Open Letter"
              width={380}
              height={190}
              className="drop-shadow-sm opacity-90 group-hover:opacity-100"
              priority
            />
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="font-courier text-[#d32f2f] text-sm tracking-widest font-bold animate-pulse">
              TAP TO START
            </span>
          </div>
        </button>

        {/* Skip Link - Direct navigation option */}
        <Link
          href="/draw"
          className="font-courier text-[#9a9a9a] text-xs tracking-wider hover:text-[#3c3c3c] transition-colors underline underline-offset-4"
        >
          Skip intro →
        </Link>

        {/* Minimal Footer Text */}
        <div className="absolute bottom-10 text-center space-y-2 opacity-60">
          <p className="font-courier text-[#3c3c3c] text-xs tracking-widest uppercase">
            A slow digital letter, drawn by hand
          </p>
          <p className="font-courier text-[#3c3c3c] text-[10px]">
            © 2025 HOLLSY PROJECT
          </p>
        </div>

      </div>

      {/* Welcome Modal */}
      {showModal && (
        <WelcomeModal
          onClose={handleModalClose}
          onStart={handleStart}
        />
      )}
    </div>
  );
}
