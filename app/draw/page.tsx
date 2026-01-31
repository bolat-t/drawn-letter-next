"use client";

import { useState, useRef } from "react";
import HandCanvas, { HandCanvasRef } from "@/app/components/Drawing/HandCanvas";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DrawPage() {
    const router = useRouter();
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState("#9bba98");
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
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 z-20">
                <Link href="/">
                    <button className="p-2 bg-white/50 rounded-full hover:bg-white transition-colors">
                        <ArrowLeft className="w-6 h-6 text-[#3c3c3c]" />
                    </button>
                </Link>
                <h1 className="font-courier text-lg font-bold text-[#3c3c3c]">Hand Draw</h1>
                <button onClick={handleFinish} className="flex items-center gap-2 px-4 py-2 bg-[#d32f2f] text-white font-courier rounded-full shadow-md hover:bg-[#b71c1c] transition-colors">
                    <span>Next</span>
                    <Save className="w-4 h-4" />
                </button>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 relative m-4 mt-0 touch-none">
                <HandCanvas ref={canvasRef} brushColor={brushColor} brushSize={brushSize} />
            </div>

            {/* Controls Toolbar */}
            <div className="p-6 bg-white/90 backdrop-blur-md rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20">
                <div className="flex items-center justify-between max-w-md mx-auto">

                    {/* Color Picker */}
                    <div className="flex gap-3">
                        {["#9bba98", "#d32f2f", "#3c3c3c", "#3b82f6"].map((color) => (
                            <button
                                key={color}
                                onClick={() => setBrushColor(color)}
                                className={`w-10 h-10 rounded-full border-2 transition-transform ${brushColor === color ? 'border-[#3c3c3c] scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>

                    {/* Size Picker */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-2 px-4">
                        <button onClick={() => setBrushSize(3)} className={`p-1 rounded ${brushSize === 3 ? 'bg-white shadow' : ''}`}>
                            <div className="w-2 h-2 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button onClick={() => setBrushSize(8)} className={`p-1 rounded ${brushSize === 8 ? 'bg-white shadow' : ''}`}>
                            <div className="w-4 h-4 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button onClick={() => setBrushSize(15)} className={`p-1 rounded ${brushSize === 15 ? 'bg-white shadow' : ''}`}>
                            <div className="w-6 h-6 bg-[#3c3c3c] rounded-full" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
