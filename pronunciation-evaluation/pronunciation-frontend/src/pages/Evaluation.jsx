import { useState, useMemo } from 'react';
import { useEvaluation } from '../contexts/EvaluationContext';
import AudioRecorder from '../components/audio/AudioRecorder';
import ScoreCard from '../components/evaluation/ScoreCard';
import PhonemeViewer from '../components/evaluation/PhonemeViewer';
import Loader from '../components/ui/Loader';

const API_ENDPOINT = 'http://localhost:8000/api/v1/analyze';

const SectionContainer = ({ title, children, className = '' }) => (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        {children}
    </div>
);
const InstructionsPanel = () => (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-blue-800 mb-2">How to use this tool:</h2>
        <ol className="list-decimal list-inside text-blue-700 space-y-1">
            <li>Enter the text you want to practice in the "Reference Text" field</li>
            <li>Record yourself speaking the text or upload an audio file</li>
            <li>Submit the recording for evaluation</li>
            <li>Review your pronunciation score and feedback</li>
        </ol>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg" role="alert" aria-live="assertive">
        <h3 className="font-semibold">Error</h3>
        <p>{message}</p>
    </div>
);

export default function Evaluation() {
    const { evaluation, isLoading, error, evaluatePronunciation } = useEvaluation();
    const [lastSubmitted, setLastSubmitted] = useState(null);


    const results = useMemo(() => {
        if (!evaluation || isLoading) return null;

        return {
            phonemeAlignment: evaluation.phoneme_alignment?.alignment,
            score: evaluation.pronunciation_score,
            transcription: evaluation.transcription
        };
    }, [evaluation, isLoading]);

    const handleEvaluationResult = async (result) => {
        try {
            if (result) {
                setLastSubmitted(new Date());

                if (result.error) {
                    console.error('Error from AudioRecorder:', result.error);
                } else {

                    console.log('Received result from AudioRecorder:', result);

                    if (!result.pronunciation_score) {
                        console.warn('Missing pronunciation_score in result', result);
                    }
                }

                evaluatePronunciation(result);
            }
        } catch (err) {
            console.error('Error processing evaluation result:', err);
        }
    };

    const renderResults = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center space-x-4 p-6 bg-white shadow-md rounded-lg">
                    <Loader />
                    <span className="text-gray-700">Evaluating your pronunciation...</span>
                </div>
            );
        }

        if (!evaluation) return null;

        return (
            <div className="space-y-6" aria-live="polite">
                <SectionContainer title="Phoneme Alignment">
                    <PhonemeViewer alignment={results.phonemeAlignment} />
                </SectionContainer>

                <SectionContainer title="Pronunciation Score">
                    <ScoreCard score={results.score} />
                </SectionContainer>



                <SectionContainer title="Transcription">
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-700">{results.transcription}</p>
                    </div>
                </SectionContainer>
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto p-4 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Pronunciation Evaluation</h1>
                <InstructionsPanel />
            </header>

            <main>
                <SectionContainer title="Record Your Pronunciation">
                    <AudioRecorder
                        onSubmit={handleEvaluationResult}
                        disabled={isLoading}
                        apiEndpoint={API_ENDPOINT}
                        key={`recorder-${lastSubmitted}`}
                    />
                </SectionContainer>

                {error && <ErrorMessage message={error} />}

                {renderResults()}
            </main>
        </div>
    );
}