# Speech Pronunciation Analyzer

## Overview
This project is designed to evaluate and improve speech pronunciation using deep learning models. It integrates multiple services for speech-to-text (ASR), phoneme alignment, and pronunciation scoring. The application provides a web interface for users to record their speech, receive feedback on their pronunciation, and track their progress.

### Features:
- **Automatic Speech Recognition (ASR)** using Whisper
- **Phoneme Alignment** to analyze pronunciation at the phoneme level
- **Pronunciation Scoring** for evaluating speech clarity, fluency, and accuracy
- **Real-time Feedback** for users

## Services
The project consists of multiple services, each running on its own port. The services are:

- **ASR Service**: Converts audio input into text using Whisper.
- **Alignment Service**: Aligns the input speech to phonemes for detailed analysis.
- **Scoring Service**: Scores the pronunciation based on accuracy, fluency, and clarity.
- **API Gateway**: Handles communication between the frontend and backend services.

## Running the Services

### Prerequisites:
Ensure you have Python 3.8+ and the required dependencies installed. For each service, navigate to the corresponding folder and install dependencies:

```bash
cd pronunciation-evaluation/<service>/app
pip install -r requirements.txt
Commands to Run Each Service:
ASR Service:
This service runs on port 8001.

bash
uvicorn app.main:app --reload --port 8001
Alignment Service:
This service runs on port 8002. Note: To run the alignment service, you will need to set up a virtual environment and install specific dependencies for MFA (Montreal Forced Aligner).

Steps for Alignment Service:

Create a virtual environment:
python -m venv venv
Activate the virtual environment:

On Windows:
.\venv\Scripts\activate
On macOS/Linux:
source venv/bin/activate
Install the required dependencies for MFA:
pip install -r requirements.txt
Run the Alignment Service:
uvicorn app.main:app --reload --port 8002
Scoring Service:
This service runs on port 8003.
uvicorn app.main:app --reload --port 8003
API Gateway:
This service runs on port 8000 and serves as the main entry point for the frontend to interact with the backend services.
uvicorn app.main:app --reload --port 8000
Running the Frontend:
To run the frontend of the application, follow these steps:

Navigate to the pronunciation-evaluation/pronunciation-frontend directory:
cd pronunciation-evaluation/pronunciation-frontend
Install the required dependencies:
npm install
Start the development server:
npm run dev
The frontend will be available at http://localhost:3000.

API Gateway Integration:
The frontend will communicate with the backend services through the API Gateway running on http://localhost:8000. Make sure all backend services are running before starting the frontend.

Folder Structure
pronunciation-evaluation/
├── pronunciation-backend/
│   ├── asr-service/
│   │   └── app/
│   ├── alignment-service/
│   │   └── app/
│   ├── scoring-service/
│   │   └── app/
│   └── api-gateway/
│       └── app/
├── pronunciation-frontend/
│   └── src/
│       └── components/
│       └── pages/
│       └── services/
└── .gitignore
Conclusion
This project allows users to assess and improve their pronunciation through a powerful and interactive interface. It leverages the Whisper ASR model, phoneme alignment, and deep learning-based scoring to provide real-time feedback.

Ensure you have all services running and the virtual environment activated for the alignment service to properly execute the MFA alignment process.

This README now includes instructions on creating and activating a virtual environment for the Alignment Service. Let me know if you'd like any further adjustments!
