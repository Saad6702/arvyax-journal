import { useState, useEffect } from 'react'
import axios from 'axios'
import './index.css'

const API = 'https://arvyax-journal-fno9.onrender.com/api/journal'

export default function App() {
  const [userId, setUserId] = useState('user1')
  const [ambience, setAmbience] = useState('forest')
  const [text, setText] = useState('')
  const [entries, setEntries] = useState([])
  const [insights, setInsights] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analyzeText, setAnalyzeText] = useState('')
  const [analyzeEntryId, setAnalyzeEntryId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchEntries()
    fetchInsights()
  }, [userId])

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API}/${userId}`)
      setEntries(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchInsights = async () => {
    try {
      const res = await axios.get(`${API}/insights/${userId}`)
      setInsights(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const submitEntry = async () => {
    if (!text.trim()) return setMessage('Please write something!')
    setLoading(true)
    try {
      await axios.post(API, { userId, ambience, text })
      setMessage('Entry saved!')
      setText('')
      fetchEntries()
      fetchInsights()
    } catch (err) {
      setMessage('Error saving entry.')
    }
    setLoading(false)
  }

  const analyzeJournal = async () => {
    if (!analyzeText.trim()) return setMessage('Please enter text to analyze!')
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await axios.post(`${API}/analyze`, {
        text: analyzeText,
        entryId: analyzeEntryId
      })
      setAnalysis(res.data)
      setMessage('')
      fetchEntries()
      fetchInsights()
    } catch (err) {
      setMessage('Analysis failed. Check your API key.')
    }
    setLoading(false)
  }

  return (
    <div className="container">
      <h1>🌿 ArvyaX Journal</h1>

      {/* User Selector */}
      <div className="card">
        <label>User ID:</label>
        <input
          value={userId}
          onChange={e => setUserId(e.target.value)}
          placeholder="Enter user ID"
        />
      </div>

      {/* Write Entry */}
      <h2>📝 Write Journal Entry</h2>
      <div className="card">
        <label>Ambience:</label>
        <select value={ambience} onChange={e => setAmbience(e.target.value)}>
          <option value="forest">🌲 Forest</option>
          <option value="ocean">🌊 Ocean</option>
          <option value="mountain">⛰️ Mountain</option>
        </select>
        <label>Journal Entry:</label>
        <textarea
          rows={4}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="How did you feel during your session?"
        />
        <button onClick={submitEntry} disabled={loading}>
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
        {message && <p className="success">{message}</p>}
      </div>

      {/* Analyze */}
      <h2>🧠 Analyze Emotion</h2>
      <div className="card">
        <textarea
          rows={3}
          value={analyzeText}
          onChange={e => {
            setAnalyzeText(e.target.value)
            setAnalyzeEntryId(null)
          }}
          placeholder="Paste any journal text here to analyze..."
        />
        <button onClick={analyzeJournal} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
        {analysis && (
          <div style={{ marginTop: 10 }}>
            <p><strong>Emotion:</strong> <span className="emotion-tag">{analysis.emotion}</span></p>
            <p><strong>Keywords:</strong> {analysis.keywords?.map(k => (
              <span key={k} className="emotion-tag">{k}</span>
            ))}</p>
            <p><strong>Summary:</strong> {analysis.summary}</p>
          </div>
        )}
      </div>

      {/* Insights */}
      <h2>📊 Insights</h2>
      {insights && (
        <div className="insights-grid">
          <div className="insight-box">
            <h3>Total Entries</h3>
            <p>{insights.totalEntries}</p>
          </div>
          <div className="insight-box">
            <h3>Top Emotion</h3>
            <p>{insights.topEmotion || 'N/A'}</p>
          </div>
          <div className="insight-box">
            <h3>Fav Ambience</h3>
            <p>{insights.mostUsedAmbience || 'N/A'}</p>
          </div>
          <div className="insight-box">
            <h3>Recent Keywords</h3>
            <p style={{ fontSize: 14 }}>{insights.recentKeywords?.join(', ') || 'N/A'}</p>
          </div>
        </div>
      )}

      {/* Past Entries */}
      <h2>📖 Past Entries</h2>
      {entries.length === 0 && <p>No entries yet.</p>}
      {entries.map(entry => (
        <div key={entry.id} className="card">
          <p>
            <strong>{entry.ambience}</strong> · {new Date(entry.createdAt).toLocaleDateString()}
          </p>
          <p style={{ margin: '8px 0' }}>{entry.text}</p>
          {entry.emotion
            ? <span className="emotion-tag">{entry.emotion}</span>
            : (
              <button onClick={() => {
                setAnalyzeText(entry.text)
                setAnalyzeEntryId(entry.id)
                window.scrollTo({ top: 300, behavior: 'smooth' })
              }}>
                Analyze this entry
              </button>
            )
          }
          {entry.summary && (
            <p style={{ fontSize: 13, color: '#555', marginTop: 5 }}>
              {entry.summary}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}