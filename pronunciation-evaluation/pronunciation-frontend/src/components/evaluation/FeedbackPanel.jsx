import PropTypes from 'prop-types';
import { useState } from 'react';

export default function FeedbackPanel({ feedback = [] }) {
    const [expanded, setExpanded] = useState(true);

    const validFeedback = Array.isArray(feedback)
        ? feedback.filter(f => f && f.trim() !== '')
        : [];
    const hasFeedback = validFeedback.length > 0;
    const categorizedFeedback = {
        critical: [],
        improvement: [],
        general: []
    };

    validFeedback.forEach(item => {
        if (/incorrect|error|wrong|mispronounced/i.test(item)) {
            categorizedFeedback.critical.push(item);
        } else if (/improve|better|should|could|try/i.test(item)) {
            categorizedFeedback.improvement.push(item);
        } else {
            categorizedFeedback.general.push(item);
        }
    });

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div
                className="flex justify-between items-center p-6 cursor-pointer bg-gradient-to-r from-blue-50 to-white"
                onClick={() => setExpanded(!expanded)}
            >
                <h2 className="text-xl font-semibold text-gray-800">
                    Pronunciation Feedback
                </h2>
                <div className="flex items-center">
                    {hasFeedback && (
                        <span className="mr-3 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {validFeedback.length} {validFeedback.length === 1 ? 'item' : 'items'}
                        </span>
                    )}
                    <button
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                        aria-label={expanded ? 'Collapse feedback' : 'Expand feedback'}
                    >
                        {expanded ? '▼' : '►'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-6 pt-0">
                    {hasFeedback ? (
                        <div className="space-y-4">
                            {categorizedFeedback.critical.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-medium text-red-600 mb-2 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Critical Issues
                                    </h3>
                                    <ul className="space-y-2 pl-7">
                                        {categorizedFeedback.critical.map((item, idx) => (
                                            <li key={`critical-${idx}`} className="flex items-start">
                                                <span className="text-red-500 mr-2 text-lg">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {categorizedFeedback.improvement.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="font-medium text-amber-600 mb-2 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Areas for Improvement
                                    </h3>
                                    <ul className="space-y-2 pl-7">
                                        {categorizedFeedback.improvement.map((item, idx) => (
                                            <li key={`improvement-${idx}`} className="flex items-start">
                                                <span className="text-amber-500 mr-2 text-lg">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {categorizedFeedback.general.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-blue-600 mb-2 flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 3a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" />
                                        </svg>
                                        General Feedback
                                    </h3>
                                    <ul className="space-y-2 pl-7">
                                        {categorizedFeedback.general.map((item, idx) => (
                                            <li key={`general-${idx}`} className="flex items-start">
                                                <span className="text-blue-500 mr-2 text-lg">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-4 text-center">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500">No detailed feedback available.</p>
                            <p className="text-gray-400 text-sm mt-1">Your pronunciation was likely good!</p>
                        </div>
                    )}

                    {hasFeedback && (
                        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-medium text-blue-700 mb-2">Tips for Improvement</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Practice problem sounds in isolation first</li>
                                <li>• Record yourself and compare with native speakers</li>
                                <li>• Focus on one issue at a time</li>
                                <li>• Regular practice with feedback is key to improvement</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

FeedbackPanel.propTypes = {
    feedback: PropTypes.arrayOf(PropTypes.string)
};