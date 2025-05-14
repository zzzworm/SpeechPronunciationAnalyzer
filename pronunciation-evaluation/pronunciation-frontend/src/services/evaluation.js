// src/services/evaluation.js
import api from './api'; // already points at http://localhost:8000/api/v1

export const evaluatePronunciation = async (audioBlob, referenceText) => {
    if (!audioBlob || !referenceText) {
        throw new Error('Both audio file and reference text are required');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('text', referenceText);

    try {
        console.log('Sending evaluation request...');
        const response = await api.post('/analyze', formData);

        if (!response.data) {
            throw new Error('Empty response from server');
        }
        console.log('Received response:', response.data);

        // Map your back-end fields into a single object:
        const data = response.data;
        return {
            status: data.status || 'success',
            transcription: data.transcription || '',
            // your gateway nested these under phoneme_alignment & pronunciation_score
            alignment: data.phoneme_alignment?.alignment || [],
            scoring: {
                pronunciation_accuracy: data.pronunciation_score?.pronunciation_accuracy ?? 0,
                fluency: data.pronunciation_score?.fluency ?? { speech_rate: 0, pause_count: 0 }
            },
            feedback: data.pronunciation_score?.error_analysis || []
        };
    } catch (error) {
        console.error('Full error details:', error);
        let errorMessage = 'Evaluation failed';
        if (error.response) {
            errorMessage =
                error.response.data?.message ||
                error.response.statusText ||
                `Server error: ${error.response.status}`;
        } else if (error.request) {
            errorMessage = 'No response from server';
        } else {
            errorMessage = error.message || 'Evaluation failed';
        }
        throw new Error(errorMessage);
    }
};
