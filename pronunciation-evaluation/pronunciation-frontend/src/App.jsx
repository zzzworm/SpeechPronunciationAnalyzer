import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EvaluationProvider } from './contexts/EvaluationContext'
import Home from './pages/Home'
import Evaluation from './pages/Evaluation'
import History from './pages/History'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'

function App() {
  return (
    <EvaluationProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/evaluate" element={<Evaluation />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </EvaluationProvider>
  )
}

export default App