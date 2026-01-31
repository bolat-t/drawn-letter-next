"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Send, Share2 } from "lucide-react";
import { supabase } from "@/utils/supabase";

export default function PostcardEditor() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [text, setText] = useState(""); // Stamp text
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [qAnswers, setQAnswers] = useState({ qa1: "", qa2: "", qa3: "", qa4: "" });

    // Load drawing and answers
    useEffect(() => {
        // Mock loading from localStorage (bridge from HandCanvas)
        // In real app, use Context or URL params
        const drawingData = localStorage.getItem("drawing");
        // const answers = JSON.parse(localStorage.getItem("qaAnswers") || "{}"); // Q&A feature (omitted for speed in migration, focus on drawing first)

        // Initial Draw
        drawCanvas(drawingData);
    }, [text, date]);

    const drawCanvas = (drawingData: string | null) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Background
        const bgImg = new Image();
        bgImg.src = "/assets/03/BG-66.png"; // Make sure this path is correct in public
        bgImg.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

            // 2. Drawing Overlay
            if (drawingData) {
                const drawImg = new Image();
                drawImg.src = drawingData;
                drawImg.onload = () => {
                    ctx.drawImage(drawImg, 0, 0, canvas.width, canvas.height);
                    drawStamp(ctx); // Draw stamp on top
                };
            } else {
                drawStamp(ctx);
            }
        };
    };

    const drawStamp = (ctx: CanvasRenderingContext2D) => {
        // Stamp Logic (Replicated from original)
        const w = 240;
        const h = 120;
        const x = ctx.canvas.width - w - 20;
        const y = ctx.canvas.height - h - 20;
        const pad = 12;
        const midY = pad + 24;

        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#d32f2f';
        ctx.fillStyle = '#d32f2f';
        ctx.lineWidth = 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Box
        ctx.strokeRect(0, 0, w, h);
        // Line
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(w, midY);
        ctx.stroke();

        // Text
        ctx.font = '16px "Courier Prime", monospace'; // Use imported font font-family name if possible, or fallback
        ctx.fillText('DRAWN LETTER', pad, midY / 2);
        ctx.fillText(text || '-', pad, midY + pad);
        ctx.fillText(date, pad, midY + pad + 24);
        ctx.restore();
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'postcard.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const handleUpload = async () => {
        if (!canvasRef.current) return;
        if (!supabase) {
            alert("Cloud upload is not configured. Please set Supabase environment variables.");
            return;
        }
        const client = supabase; // Capture for closure
        // Convert to Blob
        canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;

            // Upload to Supabase Storage
            // 1. Generate filename
            const filename = `postcard-${Date.now()}.png`;

            // 2. Upload
            const { data, error } = await client.storage
                .from('postcards') // Ensure bucket exists! I need to create it or assume it exists? I didn't create it.
                .upload(filename, blob);

            if (error) {
                alert("Upload failed: " + error.message);
            } else {
                alert("Uploaded! " + data?.path);
            }
        });
    };

    return (
        <div className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-3xl mx-auto animate-fade-in">
            {/* Canvas Preview */}
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-200">
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={600}
                    className="w-full h-auto max-w-[700px]"
                />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg w-full font-courier text-[#3c3c3c]">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5a5a5a]">Stamp Text</label>
                    <input
                        type="text"
                        maxLength={20}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="border-b-2 border-[#3c3c3c] bg-transparent outline-none px-2 py-2 min-h-[44px] focus:border-[#d32f2f] transition-colors"
                        placeholder="Enter location..."
                    />
                </div>
                <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5a5a5a]">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-b-2 border-[#3c3c3c] bg-transparent outline-none px-2 py-2 min-h-[44px] focus:border-[#d32f2f] transition-colors"
                    />
                </div>

                <div className="flex gap-3 sm:ml-auto pt-2 sm:pt-0">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] border-2 border-[#3c3c3c] rounded-full hover:bg-[#3c3c3c] hover:text-[#f5f0e6] active:scale-95 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Save</span>
                    </button>
                    <button
                        onClick={handleUpload}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-[#d32f2f] text-white rounded-full hover:bg-[#b71c1c] active:scale-95 transition-all shadow-lg font-bold"
                    >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
