import { useState, useRef, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import WaveSurfer from 'wavesurfer.js';
import axios from 'axios';

const AUDIO_FILE_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];

export default function AudioRecorder({ onSubmit, disabled, apiEndpoint = 'http://localhost:8000/api/v1/analyze' }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [referenceText, setReferenceText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [processingAudio, setProcessingAudio] = useState(false);

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        if (waveformRef.current && !wavesurferRef.current) {
            wavesurferRef.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#3B82F6',
                progressColor: '#1D4ED8',
                cursorColor: 'transparent',
                barWidth: 2,
                barRadius: 3,
                height: 80,
                responsive: true,
            });

            wavesurferRef.current.on('play', () => setIsPlaying(true));
            wavesurferRef.current.on('pause', () => setIsPlaying(false));
            wavesurferRef.current.on('finish', () => setIsPlaying(false));
        }

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
        };
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (!AUDIO_FILE_TYPES.includes(file.type)) {
            setError(`Please upload a valid audio file (${AUDIO_FILE_TYPES.join(', ')})`);
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File size should be less than 10MB');
            return;
        }

        setAudioFile(file);
        setAudioURL(URL.createObjectURL(file));

        if (wavesurferRef.current) {
            wavesurferRef.current.load(URL.createObjectURL(file));
        }

        setError(null);
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setRecordingTime(0);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Audio recording is not supported in this browser');
            }

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
            });

            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.current.push(e.data);
                }
            };

            mediaRecorder.current.onstop = async () => {
                if (audioChunks.current.length === 0) {
                    setError('No audio data was recorded');
                    return;
                }

                const audioBlob = new Blob(audioChunks.current);
                const audioUrl = URL.createObjectURL(audioBlob);

                setAudioURL(audioUrl);
                setAudioFile(new File([audioBlob], `recording-${Date.now()}.${mediaRecorder.current.mimeType.split('/')[1]}`));

                if (wavesurferRef.current) {
                    wavesurferRef.current.load(audioUrl);
                }

                cancelAnimationFrame(animationRef.current);
                clearInterval(timerIntervalRef.current);
            };


            mediaRecorder.current.start(100);
            setIsRecording(true);


            visualize();

            r
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            setError(`Error accessing microphone: ${error.message}`);
            console.error('Recording error:', error);
        }
    }, []);


    const visualize = useCallback(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);

            if (!analyserRef.current) return;
            analyserRef.current.getByteTimeDomainData(dataArray);

            if (waveformRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = waveformRef.current.clientWidth;
                canvas.height = 80;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const width = canvas.width;
                const height = canvas.height;

                ctx.clearRect(0, 0, width, height);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#3B82F6';
                ctx.beginPath();

                const sliceWidth = width / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * height / 2;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                ctx.lineTo(width, height / 2);
                ctx.stroke();


                const oldCanvas = waveformRef.current.querySelector('canvas');
                if (oldCanvas) waveformRef.current.removeChild(oldCanvas);
                waveformRef.current.appendChild(canvas);
            }
        };

        draw();
    }, []);


    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }, []);


    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && isRecording) {
            try {
                mediaRecorder.current.stop();
                if (mediaRecorder.current.stream) {
                    mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
                }
                setIsRecording(false);
            } catch (err) {
                console.error('Error stopping recording:', err);
                setError('Failed to stop recording properly');
            }
        }
    }, [isRecording]);


    const convertAudioToWav = useCallback(async (audioFile) => {
        setProcessingAudio(true);

        try {

            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            const arrayBuffer = await audioFile.arrayBuffer();


            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);


            const offlineContext = new OfflineAudioContext({
                numberOfChannels: 1,
                length: audioBuffer.duration * 16000,
                sampleRate: 16000
            });


            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);


            source.start(0);


            const renderedBuffer = await offlineContext.startRendering();


            const wavBuffer = bufferToWav(renderedBuffer);


            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            return new File([blob], `converted-${Date.now()}.wav`, { type: 'audio/wav' });
        } catch (error) {
            console.error('Error converting audio:', error);
            throw new Error('Failed to convert audio to WAV 16kHz format');
        } finally {
            setProcessingAudio(false);
        }
    }, []);


    const bufferToWav = useCallback((buffer) => {
        const numOfChannels = buffer.numberOfChannels;
        const length = buffer.length * numOfChannels * 2;
        const sampleRate = buffer.sampleRate;


        const wavBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(wavBuffer);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(view, 8, 'WAVE');


        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numOfChannels * 2, true);
        view.setUint16(32, numOfChannels * 2, true);
        view.setUint16(34, 16, true);


        writeString(view, 36, 'data');
        view.setUint32(40, length, true);


        const channels = [];
        for (let i = 0; i < numOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let c = 0; c < numOfChannels; c++) {

                const sample = Math.max(-1, Math.min(1, channels[c][i]));
                const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(offset, value, true);
                offset += 2;
            }
        }

        return wavBuffer;
    }, []);


    const writeString = useCallback((view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }, []);


    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!audioFile) {
            setError('Please record or upload audio');
            return;
        }

        if (!referenceText.trim()) {
            setError('Please enter reference text');
            return;
        }

        setLoading(true);
        setError(null);

        try {

            let processedAudioFile;
            try {
                processedAudioFile = await convertAudioToWav(audioFile);
            } catch (conversionError) {
                setError(conversionError.message);
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("audio_file", processedAudioFile);
            formData.append("text", referenceText);

            const response = await axios.post(apiEndpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000000,
            });

            if (!response.data || typeof response.data !== 'object') {
                throw new Error('Invalid response data received from server');
            }
            const responseWithContext = {
                ...response.data,
                reference_text: referenceText
            };

            if (onSubmit && typeof onSubmit === 'function') {
                onSubmit(responseWithContext);
            }
        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = error.response?.data?.detail ||
                error.message ||
                'An error occurred during evaluation';
            setError(errorMessage);

            if (onSubmit && typeof onSubmit === 'function') {
                onSubmit({ error: errorMessage });
            }
        } finally {
            setLoading(false);
        }
    }, [audioFile, referenceText, apiEndpoint, onSubmit, convertAudioToWav]);

    const resetRecording = useCallback(() => {
        setAudioURL('');
        setAudioFile(null);
        setReferenceText('');
        setError(null);
        setRecordingTime(0);

        if (wavesurferRef.current) {
            wavesurferRef.current.empty();
        }
    }, []);

    const togglePlayPause = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    }, []);

    useEffect(() => {
        return () => {
            if (mediaRecorder.current && mediaRecorder.current.stream) {
                mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            }

            cancelAnimationFrame(animationRef.current);
            clearInterval(timerIntervalRef.current);

            if (audioURL) {
                URL.revokeObjectURL(audioURL);
            }
        };
    }, [audioURL]);

    return (
        <div className="space-y-4">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Text <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    placeholder="Type or paste the reference text here"
                    className="w-full border rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    disabled={disabled || loading}
                />
                {!referenceText.trim() && (
                    <p className="text-xs text-gray-500 mt-1">
                        Please enter the text you want to compare with your audio
                    </p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload an audio file
                </label>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    disabled={isRecording || disabled || loading}
                    className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 
                disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Audio will be converted to WAV 16kHz format before processing
                </p>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700 rounded">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="flex flex-wrap gap-3">
                {!audioURL && (
                    <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={disabled || !referenceText.trim()}
                        variant={isRecording ? 'danger' : 'primary'}
                    >
                        {isRecording ? (
                            <>
                                <span className="animate-pulse mr-2">●</span>
                                Stop ({formatTime(recordingTime)})
                            </>
                        ) : (
                            'Start Recording'
                        )}
                    </Button>
                )}

                {audioURL && (
                    <>
                        <Button onClick={togglePlayPause} variant="secondary" disabled={disabled || loading}>
                            {isPlaying ? 'Pause' : 'Play'}
                        </Button>

                        <Button
                            onClick={handleSubmit}
                            disabled={disabled || loading || processingAudio || !referenceText.trim()}
                            variant="primary"
                        >
                            {loading ? 'Processing...' : processingAudio ? 'Converting Audio...' : 'Submit for Evaluation'}
                        </Button>

                        <Button
                            onClick={resetRecording}
                            variant="secondary"
                            disabled={disabled || loading}
                        >
                            Reset
                        </Button>
                    </>
                )}
            </div>
            <div className="mt-4">
                {isRecording ? (
                    <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-600">Recording in progress...</p>
                            <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                                {formatTime(recordingTime)}
                            </span>
                        </div>
                        <div ref={waveformRef} className="w-full h-20 bg-white rounded"></div>
                    </div>
                ) : audioURL ? (
                    <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                            {audioFile?.name ? `File: ${audioFile.name}` : 'Your recorded audio:'}
                        </p>
                        <div ref={waveformRef} className="w-full h-20 bg-white rounded"></div>
                        <audio
                            src={audioURL}
                            controls
                            className="w-full mt-2"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                        />
                    </div>
                ) : (
                    <div className="bg-gray-100 rounded-lg p-4 h-24 flex items-center justify-center">
                        <p className="text-gray-500">Record or upload audio after entering reference text</p>
                    </div>
                )}
            </div>
        </div>
    );
}