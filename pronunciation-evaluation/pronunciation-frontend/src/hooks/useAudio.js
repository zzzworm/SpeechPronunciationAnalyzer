import { useState, useEffect } from 'react'

export default function useAudio() {
    const [isRecording, setIsRecording] = useState(false)
    const [audioURL, setAudioURL] = useState('')
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [audioChunks, setAudioChunks] = useState([])

    useEffect(() => {
        return () => {
            if (mediaRecorder) {
                mediaRecorder.stream?.getTracks().forEach(track => track.stop())
            }
        }
    }, [mediaRecorder])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)

            recorder.ondataavailable = (e) => {
                setAudioChunks(prev => [...prev, e.data])
            }

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
                setAudioURL(URL.createObjectURL(audioBlob))
                setAudioChunks([])
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (error) {
            console.error('Error accessing microphone:', error)
        }
    }

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop()
            mediaRecorder.stream.getTracks().forEach(track => track.stop())
            setIsRecording(false)
        }
    }

    const resetRecording = () => {
        setAudioURL('')
        setAudioChunks([])
    }

    return {
        isRecording,
        audioURL,
        startRecording,
        stopRecording,
        resetRecording
    }
}