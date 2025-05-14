import { Link } from 'react-router-dom'

export default function Header() {
    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-blue-600">PronounceIt</Link>
                <nav className="flex space-x-4">
                    <Link to="/" className="px-3 py-2 text-gray-700 hover:text-blue-600">Home</Link>
                    <Link to="/evaluate" className="px-3 py-2 text-gray-700 hover:text-blue-600">Evaluate</Link>
                    <Link to="/history" className="px-3 py-2 text-gray-700 hover:text-blue-600">History</Link>
                </nav>
            </div>
        </header>
    )
}