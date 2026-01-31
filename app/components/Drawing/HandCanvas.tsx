"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
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

    // Store brush settings in refs to avoid recreating camera on every change
    const brushColorRef = useRef(brushColor);
    const brushSizeRef = useRef(brushSize);

    // Keep refs updated
    useEffect(() => {
        brushColorRef.current = brushColor;
        brushSizeRef.current = brushSize;
    }, [brushColor, brushSize]);

    // Camera and hands instances for cleanup
    const cameraRef = useRef<any>(null);
    const handsRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        getDataURL: () => {
            if (canvasRef.current) {
                // Check if canvas has any content
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    return canvasRef.current.toDataURL("image/png");
                }
            }
            return null;
        }
    }));

    // Drawing state refs
    const prevPos = useRef<{ x: number; y: number } | null>(null);
    const isErasing = useRef(false);

    // Check if libraries are already loaded (for navigation back)
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.Hands && !libLoaded.hands) {
            setLibLoaded(prev => ({ ...prev, hands: true }));
        }
        if (win.Camera && !libLoaded.camera) {
            setLibLoaded(prev => ({ ...prev, camera: true }));
        }
    }, []);

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

        if (!Hands || !Camera) {
            setStatus("Error: Libraries not loaded");
            return;
        }

        const hands = new Hands({
            locateFile: (file: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        handsRef.current = hands;

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        const isOpenHand = (lm: any[]) => {
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

            // 4. Draw - use refs for current brush settings
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
                    canvasCtx.lineWidth = brushSizeRef.current * 2.5;
                    canvasCtx.stroke();
                    canvasCtx.restore();
                } else {
                    canvasCtx.save();
                    canvasCtx.globalCompositeOperation = "source-over";
                    canvasCtx.moveTo(prevPos.current.x, prevPos.current.y);
                    canvasCtx.lineTo(x, y);
                    canvasCtx.strokeStyle = brushColorRef.current;
                    canvasCtx.lineWidth = brushSizeRef.current;
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
            height: 720,
        });

        cameraRef.current = camera;

        camera.start()
            .then(() => {
                setIsCameraReady(true);
                setStatus("Ready! Index finger to draw.");
            })
            .catch((err: any) => {
                console.error("Camera error:", err);
                setStatus("Camera Error: " + (err.message || err));
            });

        return () => {
            // Proper cleanup
            if (cameraRef.current) {
                try {
                    cameraRef.current.stop();
                } catch (e) {
                    console.warn("Camera stop error:", e);
                }
            }
            if (handsRef.current) {
                try {
                    handsRef.current.close();
                } catch (e) {
                    console.warn("Hands close error:", e);
                }
            }
        };
    }, [libLoaded.hands, libLoaded.camera]); // Only reinitialize when libs load, NOT on brush changes

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.2)] bg-white">
            {/* Messages */}
            {!isCameraReady && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f5f0e6] text-[#3c3c3c]">
                    <p className="font-courier text-lg animate-pulse">{status}</p>
                </div>
            )}

            <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover -scale-x-100 opacity-50 pointer-events-none"
                playsInline
            />

            <canvas
                ref={canvasRef}
                width={1024}
                height={768}
                className="absolute top-0 left-0 w-full h-full -scale-x-100 touch-none"
            />

            {isCameraReady && (
                <div className="absolute top-3 left-3 text-[#9bba98] text-xs font-courier opacity-70 pointer-events-none drop-shadow">
                    {status}
                </div>
            )}

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

HandCanvas.displayName = "HandCanvas";

export default HandCanvas;
