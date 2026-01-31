"use client";

import { useState, useRef } from "react";
import HandCanvas, { HandCanvasRef } from "@/app/components/Drawing/HandCanvas";
import QAQuestions from "@/app/components/Drawing/QAQuestions";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DrawPage() {
    const router = useRouter();
    const [brushSize, setBrushSize] = useState(6);
    const [brushColor, setBrushColor] = useState("#9bba98");
    const [activeQuestion, setActiveQuestion] = useState(0);
    const canvasRef = useRef<HandCanvasRef>(null);

    const handleFinish = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.getDataURL();
            if (dataUrl) {
                localStorage.setItem("drawing", dataUrl);
                router.push("/postcard");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-[#f5f0e6] flex flex-col">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: "url('/assets/02/bg-02.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "top center",
                }}
            />
            {/* Top Bar */}
            <div className="flex items-center justify-between p-3 sm:p-4 z-20">
                <Link href="/">
                    <button className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/60 rounded-full hover:bg-white active:scale-95 transition-all shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-[#3c3c3c]" />
                    </button>
                </Link>
                <h1 className="font-courier text-base sm:text-lg font-bold text-[#3c3c3c] drop-shadow-sm">Hand Draw</h1>
                <button
                    onClick={handleFinish}
                    className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-[#d32f2f] text-white font-courier text-sm font-bold rounded-full shadow-lg hover:bg-[#b71c1c] active:scale-95 transition-all"
                >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 flex flex-col overflow-auto z-10">
                {/* Q&A Questions Grid */}
                <div className="mx-3 sm:mx-4 mb-2">
                    <QAQuestions onQuestionChange={setActiveQuestion} />
                </div>

                {/* Canvas Container - Maintains 16:10 aspect ratio like original */}
                <div className="flex-1 relative mx-3 sm:mx-4 mb-2 touch-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full max-h-[60vh] aspect-[16/10]">
                            <HandCanvas ref={canvasRef} brushColor={brushColor} brushSize={brushSize} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Toolbar */}
            <div className="p-4 bg-white/90 backdrop-blur-sm rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center justify-between max-w-md mx-auto">

                    {/* Color Picker - Hybrid: Presets + Native Picker */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {["#9bba98", "#d32f2f", "#3c3c3c", "#ad9461", "#3b82f6", "#ffffff"].map((color) => (
                            <button
                                key={color}
                                onClick={() => setBrushColor(color)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all active:scale-95 ${brushColor === color ? 'border-[#3c3c3c] scale-110 shadow-md' : 'border-gray-300'}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Color ${color}`}
                            />
                        ))}
                        {/* Custom Color Picker */}
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10">
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Custom color picker"
                            />
                            <div
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-dashed border-[#3c3c3c] flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)' }}
                            >
                                <span className="text-white text-xs font-bold drop-shadow">+</span>
                            </div>
                        </div>
                    </div>

                    {/* Size Picker - Matches original: THIN(3), MEDIUM(6), THICK(12), EXTRA(20) */}
                    <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-full p-1.5 sm:p-2 px-2 sm:px-3">
                        <button
                            onClick={() => setBrushSize(3)}
                            className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 3 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Thin brush"
                            title="THIN"
                        >
                            <div className="w-1.5 h-1.5 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button
                            onClick={() => setBrushSize(6)}
                            className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 6 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Medium brush"
                            title="MEDIUM"
                        >
                            <div className="w-2.5 h-2.5 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button
                            onClick={() => setBrushSize(12)}
                            className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 12 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Thick brush"
                            title="THICK"
                        >
                            <div className="w-4 h-4 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button
                            onClick={() => setBrushSize(20)}
                            className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 20 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Extra thick brush"
                            title="EXTRA THICK"
                        >
                            <div className="w-5 h-5 bg-[#3c3c3c] rounded-full" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
