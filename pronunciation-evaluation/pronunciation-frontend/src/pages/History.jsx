import { useEvaluation } from '../contexts/EvaluationContext'

export default function History() {
    const { history } = useEvaluation()

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-center">Evaluation History</h1>

            {history.length === 0 ? (
                <p className="text-center text-gray-500">No evaluations yet. Record your first one!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {history.map((item, index) => (
                        <div key={index} className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-2">
                                Evaluation #{history.length - index}
                            </h2>
                            <p className="text-gray-600 mb-4">{item.transcription}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">
                                    Score: {Math.round(item.scoring.overall_score * 100)}%
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm ${item.scoring.overall_score > 0.7
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {item.scoring.overall_score > 0.7 ? 'Good' : 'Needs Practice'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}