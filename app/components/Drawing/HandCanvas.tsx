"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import Script from "next/script";
import {
    Point,
    Stroke,
    catmullRomSpline,
    createCoordinateFilters,
    calculateLineWidth,
    StrokeHistory,
    generateStrokeId,
    getDevicePixelRatio,
} from "@/utils/drawing";

interface HandCanvasProps {
    brushColor: string;
    brushSize: number;
}

export interface HandCanvasRef {
    getDataURL: () => string | null;
    clearCanvas: () => void;
    undo: () => boolean;
    redo: () => boolean;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

const HandCanvas = forwardRef<HandCanvasRef, HandCanvasProps>(({
    brushColor,
    brushSize,
}, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [status, setStatus] = useState("Initializing AI...");
    const [libLoaded, setLibLoaded] = useState({ hands: false, camera: false });
    const [, forceUpdate] = useState({});

    // Store brush settings in refs to avoid recreating camera on every change
    const brushColorRef = useRef(brushColor);
    const brushSizeRef = useRef(brushSize);

    // Drawing state refs
    const prevPos = useRef<Point | null>(null);
    const isErasing = useRef(false);
    const currentStrokePoints = useRef<Point[]>([]);
    const strokeHistoryRef = useRef<StrokeHistory>(new StrokeHistory(50));
    const coordinateFiltersRef = useRef(createCoordinateFilters(0.01, 0.15));

    // Camera and hands instances for cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cameraRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handsRef = useRef<any>(null);

    // Keep refs updated
    useEffect(() => {
        brushColorRef.current = brushColor;
        brushSizeRef.current = brushSize;
    }, [brushColor, brushSize]);

    // Setup stroke history change listener
    useEffect(() => {
        strokeHistoryRef.current.onChange(() => {
            forceUpdate({});
        });
    }, []);

    // Redraw all strokes from history onto offscreen canvas
    const redrawFromHistory = useCallback(() => {
        const canvas = canvasRef.current;
        const offscreen = offscreenCanvasRef.current;
        if (!canvas || !offscreen) return;

        const mainCtx = canvas.getContext("2d");
        const offCtx = offscreen.getContext("2d");
        if (!mainCtx || !offCtx) return;

        const dpr = getDevicePixelRatio();

        // Clear both canvases
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        mainCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw all strokes from history
        const strokes = strokeHistoryRef.current.getStrokes();
        offCtx.save();
        offCtx.scale(dpr, dpr);

        for (const stroke of strokes) {
            if (stroke.points.length < 2) continue;

            // Apply smoothing to stored points
            const smoothedPoints = stroke.points.length >= 4
                ? catmullRomSpline(stroke.points, 0.5, 6)
                : stroke.points;

            offCtx.strokeStyle = stroke.color;
            offCtx.lineCap = "round";
            offCtx.lineJoin = "round";
            offCtx.lineWidth = stroke.size;

            offCtx.beginPath();
            offCtx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);

            for (let i = 1; i < smoothedPoints.length; i++) {
                const curr = smoothedPoints[i];
                const prev = smoothedPoints[i - 1];

                // Variable width based on velocity
                const width = calculateLineWidth(curr, prev, stroke.size);
                offCtx.lineWidth = width;

                offCtx.lineTo(curr.x, curr.y);
            }
            offCtx.stroke();
        }

        offCtx.restore();

        // Copy offscreen to main
        mainCtx.drawImage(offscreen, 0, 0);
    }, []);

    useImperativeHandle(ref, () => ({
        getDataURL: () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const dpr = getDevicePixelRatio();

                // Create a temp canvas at CSS size (not scaled)
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width / dpr;
                tempCanvas.height = canvas.height / dpr;
                const tempCtx = tempCanvas.getContext('2d');

                if (tempCtx) {
                    // Flip horizontally for natural viewing
                    tempCtx.translate(tempCanvas.width, 0);
                    tempCtx.scale(-1, 1);
                    // Draw from offscreen at correct scale
                    if (offscreenCanvasRef.current) {
                        tempCtx.drawImage(
                            offscreenCanvasRef.current,
                            0, 0, offscreenCanvasRef.current.width, offscreenCanvasRef.current.height,
                            0, 0, tempCanvas.width, tempCanvas.height
                        );
                    }
                    return tempCanvas.toDataURL("image/png");
                }
                return canvas.toDataURL("image/png");
            }
            return null;
        },
        clearCanvas: () => {
            strokeHistoryRef.current.clear();
            coordinateFiltersRef.current.reset();
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
            if (offscreenCanvasRef.current) {
                const ctx = offscreenCanvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.clearRect(0, 0, offscreenCanvasRef.current.width, offscreenCanvasRef.current.height);
                }
            }
        },
        undo: () => {
            const undone = strokeHistoryRef.current.undo();
            if (undone) {
                redrawFromHistory();
                return true;
            }
            return false;
        },
        redo: () => {
            const redone = strokeHistoryRef.current.redo();
            if (redone) {
                redrawFromHistory();
                return true;
            }
            return false;
        },
        canUndo: () => strokeHistoryRef.current.canUndo(),
        canRedo: () => strokeHistoryRef.current.canRedo(),
    }), [redrawFromHistory]);

    // Check if libraries are already loaded (for navigation back)
    // This intentionally sets state to detect if MediaPipe was already loaded from a previous mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.Hands && !libLoaded.hands) {
            setLibLoaded(prev => ({ ...prev, hands: true }));
        }
        if (win.Camera && !libLoaded.camera) {
            setLibLoaded(prev => ({ ...prev, camera: true }));
        }
    }, [libLoaded.camera, libLoaded.hands]);

    // Setup high-DPI canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = getDevicePixelRatio();
        const cssWidth = 1024;
        const cssHeight = 768;

        // Set actual size (scaled for DPI)
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;

        // Create offscreen canvas at same size
        const offscreen = document.createElement('canvas');
        offscreen.width = cssWidth * dpr;
        offscreen.height = cssHeight * dpr;
        offscreenCanvasRef.current = offscreen;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
    }, []);

    useEffect(() => {
        if (!libLoaded.hands || !libLoaded.camera) return;
        if (!videoRef.current || !canvasRef.current) return;

        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        const canvasCtx = canvasElement.getContext("2d");
        const offscreen = offscreenCanvasRef.current;
        const offCtx = offscreen?.getContext("2d");

        if (!canvasCtx || !offscreen || !offCtx) return;

        const dpr = getDevicePixelRatio();
        const cssWidth = 1024;
        const cssHeight = 768;

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

        // Landmark type for hand detection points
        interface Landmark {
            x: number;
            y: number;
            z: number;
        }

        const isFist = (lm: Landmark[]) => {
            return [8, 12, 16, 20].every((tip) => lm[tip].y > lm[tip - 2].y);
        };

        const isEraserGesture = (lm: Landmark[]) => {
            // Peace sign: index and middle up, others down
            return (
                lm[8].y < lm[6].y && // Index up
                lm[12].y < lm[10].y && // Middle up
                lm[16].y > lm[14].y && // Ring down
                lm[20].y > lm[18].y // Pinky down
            );
        };

        const isDrawingGesture = (lm: Landmark[]) => {
            // Only index finger up
            return (
                lm[8].y < lm[6].y && // Index up
                lm[12].y > lm[10].y && // Middle down
                lm[16].y > lm[14].y && // Ring down
                lm[20].y > lm[18].y // Pinky down
            );
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hands.onResults((results: any) => {
            if (
                !results.multiHandLandmarks ||
                results.multiHandLandmarks.length === 0
            ) {
                // No hand detected - finalize current stroke
                if (currentStrokePoints.current.length > 1) {
                    const stroke: Stroke = {
                        id: generateStrokeId(),
                        points: [...currentStrokePoints.current],
                        color: brushColorRef.current,
                        size: brushSizeRef.current,
                    };
                    strokeHistoryRef.current.addStroke(stroke);
                }
                currentStrokePoints.current = [];
                prevPos.current = null;
                coordinateFiltersRef.current.reset();
                return;
            }

            const lm: Landmark[] = results.multiHandLandmarks[0];

            // Fist = pause/stop drawing - finalize stroke
            if (isFist(lm)) {
                if (currentStrokePoints.current.length > 1) {
                    const stroke: Stroke = {
                        id: generateStrokeId(),
                        points: [...currentStrokePoints.current],
                        color: brushColorRef.current,
                        size: brushSizeRef.current,
                    };
                    strokeHistoryRef.current.addStroke(stroke);
                }
                currentStrokePoints.current = [];
                prevPos.current = null;
                coordinateFiltersRef.current.reset();
                return;
            }

            // Determine Mode
            isErasing.current = isEraserGesture(lm);
            const isDrawing = isDrawingGesture(lm);

            if (!isErasing.current && !isDrawing) {
                // Finalize stroke when gesture stops
                if (currentStrokePoints.current.length > 1) {
                    const stroke: Stroke = {
                        id: generateStrokeId(),
                        points: [...currentStrokePoints.current],
                        color: brushColorRef.current,
                        size: brushSizeRef.current,
                    };
                    strokeHistoryRef.current.addStroke(stroke);
                }
                currentStrokePoints.current = [];
                prevPos.current = null;
                coordinateFiltersRef.current.reset();
                return;
            }

            // Get raw coordinates
            const rawX = lm[8].x * cssWidth;
            const rawY = lm[8].y * cssHeight;

            // Apply Kalman filter for jitter reduction
            const filtered = coordinateFiltersRef.current.filter({
                x: rawX,
                y: rawY,
                timestamp: Date.now()
            });

            const x = filtered.x;
            const y = filtered.y;

            // Scale for high-DPI
            const scaledX = x * dpr;
            const scaledY = y * dpr;

            if (prevPos.current) {
                if (isErasing.current) {
                    // Erase mode - draw on offscreen canvas
                    offCtx.save();
                    offCtx.globalCompositeOperation = "destination-out";
                    offCtx.beginPath();
                    offCtx.lineCap = "round";
                    offCtx.moveTo(prevPos.current.x * dpr, prevPos.current.y * dpr);
                    offCtx.lineTo(scaledX, scaledY);
                    offCtx.lineWidth = brushSizeRef.current * 2.5 * dpr;
                    offCtx.stroke();
                    offCtx.restore();

                    // Copy to main canvas
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(offscreen, 0, 0);
                } else {
                    // Drawing mode
                    const point: Point = { x, y, timestamp: Date.now() };
                    currentStrokePoints.current.push(point);

                    // Calculate variable width
                    const lineWidth = calculateLineWidth(
                        point,
                        prevPos.current,
                        brushSizeRef.current
                    );

                    // Draw current segment with smoothing preview
                    offCtx.save();
                    offCtx.globalCompositeOperation = "source-over";
                    offCtx.strokeStyle = brushColorRef.current;
                    offCtx.lineCap = "round";
                    offCtx.lineJoin = "round";
                    offCtx.lineWidth = lineWidth * dpr;

                    // Use quadratic curve for smoother real-time drawing
                    if (currentStrokePoints.current.length >= 3) {
                        const points = currentStrokePoints.current;
                        const len = points.length;
                        const p1 = points[len - 3];
                        const p2 = points[len - 2];
                        const p3 = points[len - 1];

                        // Midpoints for smooth curve
                        const midX = (p2.x + p3.x) / 2;
                        const midY = (p2.y + p3.y) / 2;

                        offCtx.beginPath();
                        offCtx.moveTo(p1.x * dpr, p1.y * dpr);
                        offCtx.quadraticCurveTo(p2.x * dpr, p2.y * dpr, midX * dpr, midY * dpr);
                        offCtx.stroke();
                    } else {
                        // Simple line for first few points
                        offCtx.beginPath();
                        offCtx.moveTo(prevPos.current.x * dpr, prevPos.current.y * dpr);
                        offCtx.lineTo(scaledX, scaledY);
                        offCtx.stroke();
                    }

                    offCtx.restore();

                    // Copy to main canvas
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    canvasCtx.drawImage(offscreen, 0, 0);
                }
            } else {
                // Starting new stroke
                currentStrokePoints.current = [{ x, y, timestamp: Date.now() }];
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
            .catch((err: Error) => {
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
    }, [libLoaded.hands, libLoaded.camera]);

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
                style={{ imageRendering: 'auto' }}
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
