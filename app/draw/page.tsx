"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import HandCanvas, { HandCanvasRef } from "@/app/components/Drawing/HandCanvas";
import QAQuestions from "@/app/components/Drawing/QAQuestions";
import { ArrowLeft, ArrowRight, Trash2, Undo2, Redo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DrawPage() {
    const router = useRouter();
    const [brushSize, setBrushSize] = useState(6);
    const [brushColor, setBrushColor] = useState("#9bba98");
    const [activeQuestion, setActiveQuestion] = useState(0);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const canvasRef = useRef<HandCanvasRef>(null);

    // Update undo/redo state periodically
    useEffect(() => {
        const interval = setInterval(() => {
            if (canvasRef.current) {
                setCanUndo(canvasRef.current.canUndo());
                setCanRedo(canvasRef.current.canRedo());
            }
        }, 200);
        return () => clearInterval(interval);
    }, []);

    const handleFinish = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.getDataURL();
            if (dataUrl) {
                localStorage.setItem("drawing", dataUrl);
            }
        }
        router.push("/postcard");
    };

    const handleClear = () => {
        if (canvasRef.current) {
            canvasRef.current.clearCanvas();
            setCanUndo(false);
            setCanRedo(false);
        }
    };

    const handleUndo = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.undo();
            setCanUndo(canvasRef.current.canUndo());
            setCanRedo(canvasRef.current.canRedo());
        }
    }, []);

    const handleRedo = useCallback(() => {
        if (canvasRef.current) {
            canvasRef.current.redo();
            setCanUndo(canvasRef.current.canUndo());
            setCanRedo(canvasRef.current.canRedo());
        }
    }, []);

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
                <div className="flex items-center justify-between max-w-lg mx-auto gap-2">

                    {/* Color Picker - Hybrid: Presets + Native Picker */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {["#9bba98", "#d32f2f", "#3c3c3c", "#ad9461", "#3b82f6", "#ffffff"].map((color) => (
                            <button
                                key={color}
                                onClick={() => setBrushColor(color)}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 transition-all active:scale-95 ${brushColor === color ? 'border-[#3c3c3c] scale-110 shadow-md' : 'border-gray-300'}`}
                                style={{ backgroundColor: color }}
                                aria-label={`Color ${color}`}
                            />
                        ))}
                        {/* Custom Color Picker */}
                        <div className="relative w-8 h-8 sm:w-9 sm:h-9">
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                aria-label="Custom color picker"
                            />
                            <div
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-[#3c3c3c] flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)' }}
                            >
                                <span className="text-white text-xs font-bold drop-shadow">+</span>
                            </div>
                        </div>
                    </div>

                    {/* Size Picker */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1.5 px-2">
                        <button
                            onClick={() => setBrushSize(3)}
                            className={`p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 3 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Thin brush"
                            title="THIN"
                        >
                            <div className="w-1.5 h-1.5 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button
                            onClick={() => setBrushSize(6)}
                            className={`p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 6 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Medium brush"
                            title="MEDIUM"
                        >
                            <div className="w-2.5 h-2.5 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button
                            onClick={() => setBrushSize(12)}
                            className={`p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 12 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Thick brush"
                            title="THICK"
                        >
                            <div className="w-4 h-4 bg-[#3c3c3c] rounded-full" />
                        </button>
                        <button
                            onClick={() => setBrushSize(20)}
                            className={`p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-all active:scale-90 ${brushSize === 20 ? 'bg-white shadow-md' : ''}`}
                            aria-label="Extra thick brush"
                            title="EXTRA THICK"
                        >
                            <div className="w-5 h-5 bg-[#3c3c3c] rounded-full" />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        {/* Undo */}
                        <button
                            onClick={handleUndo}
                            disabled={!canUndo}
                            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Undo"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="w-4 h-4 text-[#3c3c3c]" />
                        </button>

                        {/* Redo */}
                        <button
                            onClick={handleRedo}
                            disabled={!canRedo}
                            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Redo"
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="w-4 h-4 text-[#3c3c3c]" />
                        </button>

                        {/* Clear */}
                        <button
                            onClick={handleClear}
                            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center bg-gray-100 rounded-full hover:bg-red-100 active:scale-90 transition-all"
                            aria-label="Clear canvas"
                            title="Clear Canvas"
                        >
                            <Trash2 className="w-4 h-4 text-[#3c3c3c]" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
