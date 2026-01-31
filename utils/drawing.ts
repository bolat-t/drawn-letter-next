/**
 * Drawing Engine Utilities
 * Provides smoothing, filtering, and path optimization for the drawing canvas.
 */

export interface Point {
    x: number;
    y: number;
    timestamp?: number;
    pressure?: number;
    width?: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    size: number;
    id: string;
}

// ============================================================================
// CATMULL-ROM SPLINE INTERPOLATION
// Produces smooth, natural curves through control points
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function catmullRomSpline(points: Point[], tension: number = 0.5, segments: number = 10): Point[] {
    if (points.length < 4) return points;

    const smoothedPoints: Point[] = [];

    for (let i = 0; i < points.length - 3; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const p2 = points[i + 2];
        const p3 = points[i + 3];

        // Generate intermediate points along the spline
        for (let t = 0; t <= 1; t += 1 / segments) {
            const t2 = t * t;
            const t3 = t2 * t;

            // Catmull-Rom basis functions
            const x = 0.5 * (
                (2 * p1.x) +
                (-p0.x + p2.x) * t +
                (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
            );

            const y = 0.5 * (
                (2 * p1.y) +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
            );

            smoothedPoints.push({ x, y });
        }
    }

    // Add the last few points that weren't covered
    if (points.length >= 2) {
        smoothedPoints.push(points[points.length - 2]);
        smoothedPoints.push(points[points.length - 1]);
    }

    return smoothedPoints;
}

// ============================================================================
// KALMAN FILTER
// Reduces jitter/noise from hand tracking input
// ============================================================================

export class KalmanFilter {
    private q: number; // Process noise covariance
    private r: number; // Measurement noise covariance
    private p: number = 1; // Estimation error covariance
    private x: number = 0; // Current estimate
    private k: number = 0; // Kalman gain
    private initialized: boolean = false;

    /**
     * @param q Process noise (lower = smoother, higher = more responsive) 
     * @param r Measurement noise (higher = more filtering)
     */
    constructor(q: number = 0.01, r: number = 0.15) {
        this.q = q;
        this.r = r;
    }

    filter(measurement: number): number {
        if (!this.initialized) {
            this.x = measurement;
            this.initialized = true;
            return measurement;
        }

        // Prediction update
        this.p = this.p + this.q;

        // Measurement update
        this.k = this.p / (this.p + this.r);
        this.x = this.x + this.k * (measurement - this.x);
        this.p = (1 - this.k) * this.p;

        return this.x;
    }

    reset(): void {
        this.p = 1;
        this.x = 0;
        this.k = 0;
        this.initialized = false;
    }
}

/**
 * Creates a pair of Kalman filters for X and Y coordinates
 */
export function createCoordinateFilters(q: number = 0.01, r: number = 0.15) {
    const xFilter = new KalmanFilter(q, r);
    const yFilter = new KalmanFilter(q, r);

    return {
        filter: (point: Point): Point => ({
            x: xFilter.filter(point.x),
            y: yFilter.filter(point.y),
            timestamp: point.timestamp,
            pressure: point.pressure
        }),
        reset: () => {
            xFilter.reset();
            yFilter.reset();
        }
    };
}

// ============================================================================
// VELOCITY-BASED LINE WIDTH
// Creates natural-looking variable-width strokes
// ============================================================================

export function calculateLineWidth(
    current: Point,
    prev: Point | null,
    baseWidth: number,
    pressure: number = 1,
    minFactor: number = 0.4,
    maxFactor: number = 1.2
): number {
    if (!prev) return baseWidth * pressure;

    // Calculate velocity (distance between points)
    const dx = current.x - prev.x;
    const dy = current.y - prev.y;
    const velocity = Math.sqrt(dx * dx + dy * dy);

    // Map velocity to width factor (faster = thinner, like real brush)
    // Typical velocity range: 0-50 pixels between frames
    const velocityFactor = Math.max(minFactor, Math.min(maxFactor, 1 - velocity / 80));

    // Apply pressure if available
    const width = baseWidth * velocityFactor * pressure;

    // Smooth width transition to avoid jarring changes
    const prevWidth = prev.width || baseWidth;
    const smoothedWidth = prevWidth * 0.6 + width * 0.4;

    return Math.max(1, smoothedWidth);
}

// ============================================================================
// DOUGLAS-PEUCKER PATH SIMPLIFICATION
// Reduces point count while maintaining visual fidelity
// ============================================================================

export function simplifyPath(points: Point[], tolerance: number = 1): Point[] {
    if (points.length <= 2) return points;

    // Find point with maximum perpendicular distance from line
    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(points[i], start, end);
        if (distance > maxDistance) {
            maxDistance = distance;
            maxIndex = i;
        }
    }

    // If max distance > tolerance, recursively simplify
    if (maxDistance > tolerance) {
        const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
        const right = simplifyPath(points.slice(maxIndex), tolerance);
        return [...left.slice(0, -1), ...right];
    }

    return [start, end];
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lineLengthSquared = dx * dx + dy * dy;

    if (lineLengthSquared === 0) {
        return Math.sqrt(
            Math.pow(point.x - lineStart.x, 2) +
            Math.pow(point.y - lineStart.y, 2)
        );
    }

    // Project point onto line
    const t = Math.max(0, Math.min(1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSquared
    ));

    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;

    return Math.sqrt(
        Math.pow(point.x - projX, 2) +
        Math.pow(point.y - projY, 2)
    );
}

// ============================================================================
// HIGH-DPI CANVAS SETUP
// Ensures crisp rendering on retina/high-DPI displays
// ============================================================================

export function setupHighDPICanvas(
    canvas: HTMLCanvasElement,
    width: number,
    height: number
): CanvasRenderingContext2D | null {
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory (scaled)
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Set display size (CSS)
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: true, // May improve performance
    });

    if (!ctx) return null;

    // Scale context to match device pixel ratio
    ctx.scale(dpr, dpr);

    // Set rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return ctx;
}

export function getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
}

// ============================================================================
// STROKE HISTORY MANAGEMENT
// Enables undo/redo functionality
// ============================================================================

export class StrokeHistory {
    private strokes: Stroke[] = [];
    private redoStack: Stroke[] = [];
    private maxHistory: number;
    private onChangeCallback?: () => void;

    constructor(maxHistory: number = 50) {
        this.maxHistory = maxHistory;
    }

    onChange(callback: () => void): void {
        this.onChangeCallback = callback;
    }

    addStroke(stroke: Stroke): void {
        this.strokes.push(stroke);
        this.redoStack = []; // Clear redo when new stroke added

        // Limit history size
        if (this.strokes.length > this.maxHistory) {
            this.strokes.shift();
        }

        this.onChangeCallback?.();
    }

    undo(): Stroke | null {
        const stroke = this.strokes.pop();
        if (stroke) {
            this.redoStack.push(stroke);
            this.onChangeCallback?.();
            return stroke;
        }
        return null;
    }

    redo(): Stroke | null {
        const stroke = this.redoStack.pop();
        if (stroke) {
            this.strokes.push(stroke);
            this.onChangeCallback?.();
            return stroke;
        }
        return null;
    }

    canUndo(): boolean {
        return this.strokes.length > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    getStrokes(): Stroke[] {
        return [...this.strokes];
    }

    clear(): void {
        this.strokes = [];
        this.redoStack = [];
        this.onChangeCallback?.();
    }

    isEmpty(): boolean {
        return this.strokes.length === 0;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique stroke ID
 */
export function generateStrokeId(): string {
    return `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
