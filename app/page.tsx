import Link from "next/link";
import Image from "next/image";

export default function Home() {
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
        <Link href="/draw" className="relative group cursor-pointer">
          <div className="relative transition-all duration-500 ease-in-out transform group-hover:scale-110 group-hover:-rotate-3">
            <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 rounded-full blur-xl transition-all duration-500" />
            <Image
              src="/assets/01_index/hover-title-text.png"
              alt="Open Letter"
              width={380}
              height={190}
              className="drop-shadow-sm opacity-90 group-hover:opacity-100"
            />
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="font-courier text-[#d32f2f] text-sm tracking-widest font-bold animate-pulse">
              CLICK TO OPEN
            </span>
          </div>
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
    </div>
  );
}
