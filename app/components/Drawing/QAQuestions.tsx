"use client";

import { useState } from "react";

interface QAQuestionsProps {
    onQuestionChange?: (index: number) => void;
}

const questions = [
    "Q1. What facial expression did I find myself making most often today?",
    "Q2. What emotion is taking up the most space within me today?",
    "Q3. When today did I feel my emotions most intensely?",
    "Q4. If today's emotions were a story, how would it start?",
];

export default function QAQuestions({ onQuestionChange }: QAQuestionsProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleQuestionClick = (index: number) => {
        setActiveIndex(index);
        onQuestionChange?.(index);
    };

    return (
        <div className="grid grid-cols-2 gap-2 p-3">
            {questions.map((question, index) => (
                <button
                    key={index}
                    onClick={() => handleQuestionClick(index)}
                    className={`
                        text-left p-3 rounded-lg text-xs font-courier leading-relaxed
                        transition-all duration-200 min-h-[60px]
                        ${activeIndex === index
                            ? 'bg-[#9bba98]/30 text-[#3c3c3c] border-2 border-[#9bba98]'
                            : 'bg-white/50 text-[#5a5a5a] border border-transparent hover:bg-white/80'
                        }
                    `}
                    aria-label={`Reflection question ${index + 1}`}
                >
                    {question}
                </button>
            ))}
        </div>
    );
}
