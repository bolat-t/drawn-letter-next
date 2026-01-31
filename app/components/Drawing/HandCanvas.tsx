"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Script from "next/script";

interface HandCanvasProps {
    brushColor: string;
    brushSize: number;
}

export interface HandCanvasRef {
    getDataURL: () => string | null;
}

const HandCanvas = forwardRef<HandCanvasRef, HandCanvasProps>(({
    brushColor,
    brushSize,
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [status, setStatus] = useState("Initializing AI...");
    const [libLoaded, setLibLoaded] = useState({ hands: false, camera: false });

    useImperativeHandle(ref, () => ({
        getDataURL: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL("image/png");
            }
            return null;
        }
    }));

    // Drawing state refs
    const prevPos = useRef<{ x: number; y: number } | null>(null);
    const isErasing = useRef(false);

    useEffect(() => {
        if (!libLoaded.hands || !libLoaded.camera) return;
        if (!videoRef.current || !canvasRef.current) return;

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext("2d");

        if (!canvasCtx) return;

        // Access globals from CDN
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Hands = (window as any).Hands;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Camera = (window as any).Camera;

        const hands = new Hands({
            locateFile: (file: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        const isOpenHand = (lm: any[]) => {
            // 8, 12, 16, 20 are finger tips. 6, 10, 14, 18 are PIP joints.
            return [8, 12, 16, 20].every((tip) => lm[tip].y < lm[tip - 2].y);
        };

        const isFist = (lm: any[]) => {
            return [8, 12, 16, 20].every((tip) => lm[tip].y > lm[tip - 2].y);
        };

        const isEraserGesture = (lm: any[]) => {
            return (
                lm[8].y < lm[6].y && // Index up
                lm[12].y < lm[10].y && // Middle up
                lm[16].y > lm[14].y // Ring down
            );
        };

        const isDrawingGesture = (lm: any[]) => {
            return (
                lm[8].y < lm[6].y && // Index up
                lm[12].y > lm[10].y // Middle down
            );
        };

        hands.onResults((results: any) => {
            if (
                !results.multiHandLandmarks ||
                results.multiHandLandmarks.length === 0
            ) {
                prevPos.current = null;
                return;
            }

            const lm = results.multiHandLandmarks[0];

            // 1. Clear Canvas (Open Hand)
            if (isOpenHand(lm)) {
                canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                prevPos.current = null;
                return;
            }

            // 2. Stop Drawing (Fist)
            if (isFist(lm)) {
                prevPos.current = null;
                return;
            }

            // 3. Determine Mode
            isErasing.current = isEraserGesture(lm);
            const isDrawing = isDrawingGesture(lm);

            if (!isErasing.current && !isDrawing) {
                prevPos.current = null;
                return;
            }

            // 4. Draw
            const x = lm[8].x * canvasElement.width;
            const y = lm[8].y * canvasElement.height;

            if (prevPos.current) {
                canvasCtx.beginPath();
                canvasCtx.lineCap = "round";

                if (isErasing.current) {
                    canvasCtx.save();
                    canvasCtx.globalCompositeOperation = "destination-out";
                    canvasCtx.moveTo(prevPos.current.x, prevPos.current.y);
                    canvasCtx.lineTo(x, y);
                    canvasCtx.lineWidth = brushSize * 4; // Eraser bigger
                    canvasCtx.stroke();
                    canvasCtx.restore();
                } else {
                    canvasCtx.save();
                    canvasCtx.globalCompositeOperation = "source-over";
                    canvasCtx.moveTo(prevPos.current.x, prevPos.current.y);
                    canvasCtx.lineTo(x, y);
                    canvasCtx.strokeStyle = brushColor;
                    canvasCtx.lineWidth = brushSize;
                    canvasCtx.stroke();
                    canvasCtx.restore();
                }
            }

            prevPos.current = { x, y };
        });

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 1280,
            height: 720, // Higher res for better tracking
        });

        camera.start()
            .then(() => {
                setIsCameraReady(true);
                setStatus("Ready! Index finger to draw.");
            })
            .catch((err: any) => {
                console.error("Camera error:", err);
                setStatus("Camera Error: " + err.message || err);
            });

        return () => {
            camera.stop(); // Cleanup
            hands.close();
        }
    }, [brushColor, brushSize, libLoaded]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-[#3c3c3c] shadow-xl bg-white">
            {/* Messages */}
            {!isCameraReady && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f5f0e6] text-[#3c3c3c]">
                    <p className="font-courier text-lg animate-pulse">{status}</p>
                </div>
            )}

            {/* Video Feed (Hidden or Opacity 0 if we want to see it for debug? Usually hidden for "magic" feel, or shown as background guide) */}
            {/* Original app showed video. We should probably show it mirrored. */}
            <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 opacity-50 pointer-events-none"
                playsInline
            />

            {/* Drawing Canvas */}
            <canvas
                ref={canvasRef}
                width={1024}
                height={768}
                className="absolute top-0 left-0 w-full h-full -scale-x-100 touch-none"
            />

            {/* AI Debug / Status Overlay */}
            <div className="absolute top-4 left-4 bg-white/80 p-2 rounded text-xs font-mono pointer-events-none">
                {status}
            </div>
            {/* Load MediaPipe Scripts */}
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                strategy="afterInteractive"
                onLoad={() => setLibLoaded(prev => ({ ...prev, hands: true }))}
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                strategy="afterInteractive"
                onLoad={() => setLibLoaded(prev => ({ ...prev, camera: true }))}
            />
        </div>
    );
});

export default HandCanvas;
