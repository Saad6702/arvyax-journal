const db = require('../db/database');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: hash text for cache lookup
const hashText = (text) => {
  return crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex');
};

// POST /api/journal
const createEntry = (req, res) => {
  const { userId, ambience, text } = req.body;
  if (!userId || !ambience || !text) {
    return res.status(400).json({ error: 'userId, ambience, and text are required' });
  }
  const stmt = db.prepare('INSERT INTO journal_entries (userId, ambience, text) VALUES (?, ?, ?)');
  const result = stmt.run(userId, ambience, text);
  res.status(201).json({ message: 'Journal entry saved!', entryId: result.lastInsertRowid });
};

// GET /api/journal/:userId
const getEntries = (req, res) => {
  const { userId } = req.params;
  const entries = db.prepare('SELECT * FROM journal_entries WHERE userId = ? ORDER BY createdAt DESC').all(userId);
  res.json(entries);
};

// POST /api/journal/analyze
const analyzeEntry = async (req, res) => {
  const { text, entryId } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    // Check cache first
    const textHash = hashText(text);
    const cached = db.prepare('SELECT * FROM analysis_cache WHERE textHash = ?').get(textHash);

    if (cached) {
      console.log('Cache HIT — returning cached analysis');
      const analysis = {
        emotion: cached.emotion,
        keywords: JSON.parse(cached.keywords),
        summary: cached.summary,
        cached: true
      };

      // Save to entry if entryId provided
      if (entryId) {
        db.prepare('UPDATE journal_entries SET emotion = ?, keywords = ?, summary = ? WHERE id = ?')
          .run(analysis.emotion, cached.keywords, analysis.summary, entryId);
      }

      return res.json(analysis);
    }

    // Cache MISS — call Gemini
    console.log('Cache MISS — calling Gemini API');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = 'Analyze the emotion in this journal entry and respond ONLY with a JSON object, no extra text, no markdown:\n{\n  "emotion": "the main emotion (one word)",\n  "keywords": ["keyword1", "keyword2", "keyword3"],\n  "summary": "one sentence summary of the users mental state"\n}\n\nJournal entry: "' + text + '"';

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);

    // Save to cache
    db.prepare('INSERT OR REPLACE INTO analysis_cache (textHash, emotion, keywords, summary) VALUES (?, ?, ?, ?)')
      .run(textHash, analysis.emotion, JSON.stringify(analysis.keywords), analysis.summary);

    // Save to entry if entryId provided
    if (entryId) {
      db.prepare('UPDATE journal_entries SET emotion = ?, keywords = ?, summary = ? WHERE id = ?')
        .run(analysis.emotion, JSON.stringify(analysis.keywords), analysis.summary, entryId);
    }

    res.json({ ...analysis, cached: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'LLM analysis failed', details: err.message });
  }
};

// GET /api/journal/insights/:userId
const getInsights = (req, res) => {
  const { userId } = req.params;
  const totalEntries = db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE userId = ?').get(userId);
  const topEmotion = db.prepare('SELECT emotion, COUNT(*) as count FROM journal_entries WHERE userId = ? AND emotion IS NOT NULL GROUP BY emotion ORDER BY count DESC LIMIT 1').get(userId);
  const mostUsedAmbience = db.prepare('SELECT ambience, COUNT(*) as count FROM journal_entries WHERE userId = ? GROUP BY ambience ORDER BY count DESC LIMIT 1').get(userId);
  const recentEntries = db.prepare('SELECT keywords FROM journal_entries WHERE userId = ? AND keywords IS NOT NULL ORDER BY createdAt DESC LIMIT 5').all(userId);
  const recentKeywords = recentEntries.flatMap(e => JSON.parse(e.keywords || '[]')).slice(0, 10);

  res.json({
    totalEntries: totalEntries.count,
    topEmotion: topEmotion ? topEmotion.emotion : null,
    mostUsedAmbience: mostUsedAmbience ? mostUsedAmbience.ambience : null,
    recentKeywords
  });
};

module.exports = { createEntry, getEntries, analyzeEntry, getInsights };