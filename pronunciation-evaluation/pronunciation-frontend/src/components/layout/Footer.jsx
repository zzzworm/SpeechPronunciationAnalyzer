export default function Footer() {
    return (
        <footer className="bg-gray-100 py-6 mt-8">
            <div className="container mx-auto px-4 text-center text-gray-600">
                <p>© {new Date().getFullYear()} Pronunciation Evaluation App</p>
            </div>
        </footer>
    )
}