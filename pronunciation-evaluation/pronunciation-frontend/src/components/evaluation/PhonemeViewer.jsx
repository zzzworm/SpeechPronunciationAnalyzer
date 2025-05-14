import { useState } from 'react';
import { Play, Pause, Info } from 'lucide-react';

/**
  @param {Object} props
  @param {Array} props.alignment 
  @param {Function} props.onPlaySegment 
  @param {string} props.title
  @param {boolean} props.compact 
 */
export default function PhonemeViewer({
    alignment = [],
    onPlaySegment = null,
    title = "Phoneme Alignment",
    compact = false
}) {
    const [expandedWord, setExpandedWord] = useState(null);
    const [showTooltip, setShowTooltip] = useState(null);

    const toggleWord = (index) => {
        if (compact) {
            setExpandedWord(expandedWord === index ? null : index);
        }
    };
    const handlePlaySegment = (word, phoneme) => {
        if (onPlaySegment && typeof onPlaySegment === 'function') {
            onPlaySegment(word, phoneme);
        }
    };
    const calculateAccuracy = () => {
        if (!alignment.length) return 0;

        let correct = 0;
        let total = 0;

        alignment.forEach(word => {
            word.phonemes.forEach(phoneme => {
                if (phoneme.is_correct) correct++;
                total++;
            });
        });

        return total ? Math.round((correct / total) * 100) : 0;
    };

    const accuracy = calculateAccuracy();

    return (
        <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold">{title}</h2>

            </div>

            {alignment.length > 0 ? (
                <div className="space-y-4">
                    {alignment.map((wordObj, wi) => (
                        <div
                            key={wi}
                            className={`border rounded-lg p-3 ${wordObj.phonemes.some(p => !p.is_correct) ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
                            onClick={() => toggleWord(wi)}
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-800">{wordObj.word}</h3>
                                {compact && (
                                    <button
                                        className="text-gray-500 hover:text-gray-800 focus:outline-none"
                                        aria-label={expandedWord === wi ? "Collapse word details" : "Expand word details"}
                                    >
                                        {expandedWord === wi ? '−' : '+'}
                                    </button>
                                )}
                            </div>

                            {(!compact || expandedWord === wi) && (
                                <div className="flex flex-wrap mt-3 gap-3">
                                    {wordObj.phonemes.map((p, pi) => (
                                        <div
                                            key={pi}
                                            className="flex flex-col items-center"
                                            role="group"
                                            aria-label={`Phoneme ${p.phoneme} ${p.is_correct ? 'correct' : 'incorrect'}`}
                                        >
                                            <div className="relative group">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium shadow-sm transition-transform hover:scale-110 ${p.is_correct
                                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                                        : 'bg-red-100 text-red-800 border border-red-300'
                                                        }`}
                                                >
                                                    {p.phoneme}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePlaySegment(wordObj.word, p);
                                                    }}
                                                    className="absolute -right-1 -bottom-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label={`Play phoneme ${p.phoneme}`}
                                                >
                                                    <Play size={12} className="text-white" />
                                                </button>
                                            </div>
                                            <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                                                {p.start.toFixed(2)}–{p.end.toFixed(2)}s
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Info size={24} className="text-gray-400" />
                    </div>
                    <p>No alignment data available</p>
                </div>
            )}
        </div>
    );
}