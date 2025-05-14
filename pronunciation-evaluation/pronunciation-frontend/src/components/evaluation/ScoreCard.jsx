import PropTypes from 'prop-types';
import { memo } from 'react';

const calculateScores = (score = {}) => {
    const {
        pronunciation_accuracy = 0,
        fluency: {
            speech_rate = 0,
            pause_count = 0,
            avg_phoneme_duration = 0
        } = {},
        error_analysis = []
    } = score;

    const formattedAccuracy = Math.round(pronunciation_accuracy * 100);

    const optimalLowRate = 120;
    const optimalHighRate = 180;
    let rateScore;

    if (speech_rate < optimalLowRate) {
        rateScore = speech_rate / optimalLowRate;
    } else if (speech_rate <= optimalHighRate) {
        rateScore = 1.0;
    } else {
        rateScore = Math.max(0, 1 - (speech_rate - optimalHighRate) / 100);
    }
    const pauseScore = Math.max(0, 1 - (pause_count / 10));

    const optimalPhonemeDuration = 0.1;
    const durationVariance = Math.abs(avg_phoneme_duration - optimalPhonemeDuration);
    const phonemeDurationScore = Math.max(0, 1 - (durationVariance / 0.1));

    const weightedFluencyScore = (
        (rateScore * 0.5) +
        (pauseScore * 0.3) +
        (phonemeDurationScore * 0.2)
    );

    const formattedFluency = Math.round(weightedFluencyScore * 100);
    const formattedOverall = Math.round(((pronunciation_accuracy + weightedFluencyScore) / 2) * 100);

    return {
        accuracy: formattedAccuracy,
        fluency: formattedFluency,
        overall: formattedOverall,
        pauseCount: pause_count,
        avgPhonemeDuration: avg_phoneme_duration,
        errorAnalysis: error_analysis,
        details: {
            rateScore: Math.round(rateScore * 100),
            pauseScore: Math.round(pauseScore * 100),
            phonemeDurationScore: Math.round(phonemeDurationScore * 100)
        }
    };
};

const ScoreIndicator = ({ label, value, bgColor, textColor, ariaLabel }) => (
    <div className={`text-center p-4 ${bgColor} rounded-lg`} aria-label={ariaLabel}>
        <p className={`text-sm ${textColor}`}>{label}</p>
        <p className={`text-3xl font-bold ${textColor}`} aria-live="polite">
            {value}%
        </p>
    </div>
);

ScoreIndicator.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    bgColor: PropTypes.string.isRequired,
    textColor: PropTypes.string.isRequired,
    ariaLabel: PropTypes.string.isRequired
};

function ScoreCard({ score = {}, className = '' }) {
    const {
        accuracy,
        fluency,
        overall,
        pauseCount,
        avgPhonemeDuration,
        errorAnalysis
    } = calculateScores(score);

    return (
        <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
            <h2 className="text-xl font-semibold mb-4">Pronunciation Score</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ScoreIndicator
                    label="Accuracy"
                    value={accuracy}
                    bgColor="bg-green-50"
                    textColor="text-green-600"
                    ariaLabel={`Accuracy score: ${accuracy} percent`}
                />
                <ScoreIndicator
                    label="Fluency"
                    value={fluency}
                    bgColor="bg-blue-50"
                    textColor="text-blue-600"
                    ariaLabel={`Fluency score: ${fluency} percent`}
                />
                <ScoreIndicator
                    label="Overall"
                    value={overall}
                    bgColor="bg-purple-50"
                    textColor="text-purple-600"
                    ariaLabel={`Overall score: ${overall} percent`}
                />
            </div>

            <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                    Pauses detected: <span className="font-medium">{pauseCount}</span>
                </span>
                {overall >= 80 && (
                    <span className="text-sm text-green-600 font-medium">
                        Excellent work!
                    </span>
                )}
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold">Error Analysis</h3>
                <ul className="list-disc ml-6 mt-2">
                    {errorAnalysis.length > 0 ? (
                        errorAnalysis.map((error, index) => (
                            <li key={index} className="text-sm text-red-600">{error}</li>
                        ))
                    ) : (
                        <li className="text-sm text-gray-500">No phoneme errors detected</li>
                    )}
                </ul>
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-semibold">Fluency Metrics</h3>
                <ul className="ml-6 mt-2 list-none">
                    <li className="text-sm">
                        Average phoneme duration: {avgPhonemeDuration ? avgPhonemeDuration.toFixed(3) : 'N/A'} seconds
                    </li>
                </ul>
            </div>
        </div>
    );
}

ScoreCard.propTypes = {
    score: PropTypes.shape({
        pronunciation_accuracy: PropTypes.number,
        fluency: PropTypes.shape({
            speech_rate: PropTypes.number,
            pause_count: PropTypes.number,
            avg_phoneme_duration: PropTypes.number
        }),
        error_analysis: PropTypes.arrayOf(PropTypes.string)
    }),
    className: PropTypes.string
};

export default memo(ScoreCard);
