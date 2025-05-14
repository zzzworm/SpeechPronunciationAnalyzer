import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function Home() {
    return (
        <div className="text-center py-12">
            <h1 className="text-4xl font-bold mb-6">Improve Your Pronunciation</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Record your speech, get instant feedback on your pronunciation, and track your progress over time.
            </p>
            <Link to="/evaluate">
                <Button size="lg">Start Evaluating</Button>
            </Link>
        </div>
    )
}