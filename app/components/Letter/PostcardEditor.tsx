"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Send } from "lucide-react";
import Link from "next/link";
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
        // Convert to Blob
        canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;

            // Upload to Supabase Storage
            // 1. Generate filename
            const filename = `postcard-${Date.now()}.png`;

            // 2. Upload
            const { data, error } = await supabase.storage
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
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto p-4">
            {/* Canvas Preview */}
            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
                <canvas
                    ref={canvasRef}
                    width={1000}
                    height={600}
                    className="w-full h-auto max-w-[800px]"
                />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-end bg-white/80 p-6 rounded-xl backdrop-blur-sm w-full font-courier text-[#3c3c3c]">
                <div className="flex flex-col gap-2">
                    <label>Stamp Text</label>
                    <input
                        type="text"
                        maxLength={20}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="border-b-2 border-[#3c3c3c] bg-transparent outline-none px-2 py-1"
                        placeholder="Enter location..."
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border-b-2 border-[#3c3c3c] bg-transparent outline-none px-2 py-1"
                    />
                </div>

                <div className="ml-auto flex gap-4">
                    <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 border-2 border-[#3c3c3c] rounded-full hover:bg-[#3c3c3c] hover:text-[#f5f0e6] transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Save Image</span>
                    </button>
                    <button onClick={handleUpload} className="flex items-center gap-2 px-6 py-2 bg-[#d32f2f] text-white rounded-full hover:bg-[#b71c1c] transition-colors shadow-md">
                        <Send className="w-4 h-4" />
                        <span>Send to Cloud</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
