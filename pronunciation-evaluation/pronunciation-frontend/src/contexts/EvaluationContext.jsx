import { createContext, useContext, useState, useCallback } from 'react';


const EvaluationContext = createContext();

export const EvaluationProvider = ({ children }) => {
    const [evaluation, setEvaluation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    const evaluatePronunciation = useCallback((data) => {
        try {
            setError(null);
            if (data.error) {
                setError(data.error);
                return;
            }
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid evaluation data received');
            }
            const missingFields = [];

            if (!data.pronunciation_score) missingFields.push('pronunciation_score');
            if (missingFields.length > 0) {
                throw new Error(`Missing required data: ${missingFields.join(', ')}`);
            }
            setEvaluation(data);
            console.log('Evaluation data processed successfully:', data);

        } catch (err) {
            console.error('Context evaluation error:', err);
            setError(err.message || 'Error processing evaluation data');
            setEvaluation(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);

    const resetEvaluation = useCallback(() => {
        setEvaluation(null);
        setIsLoading(false);
        setError(null);
    }, []);

    const value = {
        evaluation,
        isLoading,
        error,
        evaluatePronunciation,
        startLoading,
        resetEvaluation
    };

    return (
        <EvaluationContext.Provider value={value}>
            {children}
        </EvaluationContext.Provider>
    );
};

export const useEvaluation = () => {
    const context = useContext(EvaluationContext);
    if (!context) {
        throw new Error('useEvaluation must be used within an EvaluationProvider');
    }
    return context;
};