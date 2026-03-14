# ArvyaX Journal System

An AI-assisted journal system for nature wellness sessions. Users write journal entries after immersive nature sessions, and the system analyzes emotions using Google Gemini AI.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: React + Vite
- **LLM**: Google Gemini API

## Getting Started

### Prerequisites
- Node.js v18+
- Google Gemini API key (free at https://aistudio.google.com/apikey)

### Installation

1. Clone the repository
2. Setup Backend:
```bash
cd backend
npm install
```

3. Create `backend/.env`:
```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Setup Frontend:
```bash
cd frontend
npm install
```

### Running the App

Backend (Terminal 1):
```bash
cd backend
npm run dev
```

Frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/journal | Save a new journal entry |
| GET | /api/journal/:userId | Get all entries for a user |
| POST | /api/journal/analyze | Analyze emotion using LLM |
| GET | /api/journal/insights/:userId | Get insights summary |

## Example API Usage

### Save a journal entry
```json
POST /api/journal
{
  "userId": "123",
  "ambience": "forest",
  "text": "I felt calm today after listening to the rain."
}
```

### Analyze emotion
```json
POST /api/journal/analyze
{
  "text": "I felt calm today after listening to the rain."
}
```

### Response
```json
{
  "emotion": "calm",
  "keywords": ["rain", "nature", "peace"],
  "summary": "User experienced relaxation during the forest session"
}
```

## Project Structure
```
arvyx-journal/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── journalController.js
│   │   ├── db/
│   │   │   └── database.js
│   │   ├── routes/
│   │   │   └── journal.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
├── README.md
└── ARCHITECTURE.md
```