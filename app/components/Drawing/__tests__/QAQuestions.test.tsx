import { render, screen, fireEvent } from '@testing-library/react';
import QAQuestions from '../QAQuestions';

describe('QAQuestions', () => {
    it('renders all questions', () => {
        render(<QAQuestions />);
        // Check for presence of questions
        expect(screen.getByText(/What facial expression/i)).toBeInTheDocument();
        expect(screen.getByText(/What emotion/i)).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(4);
    });

    it('highlights the selected question', () => {
        render(<QAQuestions />);

        const firstQuestion = screen.getByText(/What facial expression/i).closest('button');
        const secondQuestion = screen.getByText(/What emotion/i).closest('button');

        // First question should be active initially (checking class/style roughly)
        expect(firstQuestion).toHaveClass('border-[#9bba98]');
        expect(secondQuestion).toHaveClass('border-transparent');

        // Click second question
        fireEvent.click(secondQuestion!);

        // Second should become active
        expect(secondQuestion).toHaveClass('border-[#9bba98]');
    });

    it('calls onQuestionChange when question selected', () => {
        const handleQuestionChange = jest.fn();
        render(<QAQuestions onQuestionChange={handleQuestionChange} />);

        const secondQuestion = screen.getByText(/What emotion/i).closest('button');
        fireEvent.click(secondQuestion!);

        // Index 1 for second question
        expect(handleQuestionChange).toHaveBeenCalledWith(1);
    });
});
