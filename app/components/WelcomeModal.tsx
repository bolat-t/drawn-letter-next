"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface WelcomeModalProps {
    onClose: () => void;
    onStart: () => void;
}

export default function WelcomeModal({ onClose, onStart }: WelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Animate in
        const animateTimeout = setTimeout(() => setIsVisible(true), 50);

        // Cleanup on unmount
        return () => {
            clearTimeout(animateTimeout);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        closeTimeoutRef.current = setTimeout(onClose, 300);
    };

    const handleStart = () => {
        setIsVisible(false);
        startTimeoutRef.current = setTimeout(onStart, 300);
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent'
                }`}
            onClick={handleClose}
        >
            <div
                className={`relative bg-[#f5f0e6] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 text-[#3c3c3c]" />
                </button>

                {/* Modal Content */}
                <div className="p-6 sm:p-8 pt-10 sm:pt-12 text-center space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                        <h2 className="font-courier text-xl sm:text-2xl font-bold text-[#3c3c3c] tracking-wide">
                            DRAWN LETTER
                        </h2>
                        <div className="w-16 h-0.5 bg-[#d32f2f] mx-auto" />
                    </div>

                    {/* Description */}
                    <div className="space-y-3 text-[#5a5a5a] font-courier text-sm leading-relaxed">
                        <p>
                            A slow digital letter, drawn by hand.
                        </p>
                        <p>
                            Use your hand gestures to draw and express your emotions.
                        </p>
                    </div>

                    {/* Instructions - Updated gestures */}
                    <div className="bg-white/60 rounded-xl p-4 text-left space-y-2">
                        <p className="font-courier text-xs text-[#3c3c3c] font-bold uppercase tracking-wider">
                            Hand Gestures
                        </p>
                        <ul className="font-courier text-xs text-[#5a5a5a] space-y-1.5">
                            <li className="flex items-center gap-2">
                                <span className="text-base">☝️</span>
                                <span><strong>Index finger</strong> → Draw</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-base">✌️</span>
                                <span><strong>Peace sign</strong> → Erase</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-base">✊</span>
                                <span><strong>Fist</strong> → Pause</span>
                            </li>
                        </ul>
                    </div>

                    {/* Start Button - Centered with proper width */}
                    <div className="pt-2">
                        <button
                            onClick={handleStart}
                            className="w-full max-w-[280px] mx-auto block py-3.5 px-6 bg-[#d32f2f] text-white font-courier font-bold text-base rounded-full shadow-lg hover:bg-[#b71c1c] hover:shadow-xl active:scale-95 transition-all duration-200"
                        >
                            START DRAWING
                        </button>
                    </div>

                    {/* Skip text */}
                    <p className="font-courier text-xs text-[#9a9a9a] pt-1">
                        Tap outside to skip
                    </p>
                </div>
            </div>
        </div>
    );
}
