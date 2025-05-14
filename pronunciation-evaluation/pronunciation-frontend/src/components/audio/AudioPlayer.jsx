export default function AudioPlayer({ src }) {
    return (
        <div className="mt-4">
            <audio
                src={src}
                controls
                className="w-full rounded-lg bg-gray-100"
            />
        </div>
    )
}