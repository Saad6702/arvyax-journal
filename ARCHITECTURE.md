# ARCHITECTURE.md — ArvyaX Journal System

## System Overview

The ArvyaX Journal System is built with a 3-tier architecture:
- **Frontend**: React (Vite) — runs on port 5173
- **Backend**: Node.js + Express — runs on port 5000
- **Database**: SQLite — stored as a local file (database.db)
- **LLM**: Google Gemini API — used for emotion analysis

---

## 1. How would you scale this to 100,000 users?

### Database
- Replace SQLite with **PostgreSQL** — SQLite is a file-based database and cannot handle concurrent writes from multiple users efficiently.
- Add **database indexing** on `userId` and `createdAt` columns to speed up queries.
- Use **connection pooling** (e.g., pg-pool) to handle many simultaneous DB connections.

### Backend
- Deploy the Express server on **multiple instances** behind a **load balancer** (e.g., AWS ALB or Nginx).
- Use **horizontal scaling** — run multiple copies of the backend server so traffic is distributed.
- Move to a **microservices architecture** if needed — separate the journal service and the analysis service.

### LLM Analysis
- Process emotion analysis in the **background using a job queue** (e.g., BullMQ + Redis) instead of making the user wait for the LLM response.
- This way, saving a journal entry is instant, and analysis happens asynchronously.

### Frontend
- Deploy on a **CDN** (e.g., Vercel, Cloudflare Pages) so static assets load fast globally.

---

## 2. How would you reduce LLM cost?

- **Cache analysis results** — if the same or very similar text has been analyzed before, return the cached result instead of calling the LLM again (see point 3 below).
- **Batch processing** — instead of analyzing each entry immediately, batch multiple entries and analyze them together in one API call.
- **Use a smaller/cheaper model** — Gemini Flash is much cheaper than Gemini Pro. Use the smallest model that gives acceptable results.
- **Limit input size** — truncate journal entries to a maximum of 500 characters before sending to the LLM, since longer text costs more tokens.
- **Only analyze on demand** — don't automatically analyze every entry. Only call the LLM when the user explicitly clicks "Analyze", which is what we do in this system.

---

## 3. How would you cache repeated analysis?

### Strategy: Hash-based caching with Redis

1. When an analyze request comes in, generate a **hash of the input text** (e.g., using MD5 or SHA256).
2. Check **Redis** to see if we already have a cached result for that hash.
3. If yes — return the cached result immediately (no LLM call needed).
4. If no — call the LLM, store the result in Redis with the hash as the key, then return it.

### Example Flow:
```
User submits text → Hash the text → Check Redis
  → Cache HIT  → Return cached emotion/keywords/summary
  → Cache MISS → Call Gemini API → Store in Redis → Return result
```

### Additional caching:
- Cache the **insights endpoint** per user with a short TTL (e.g., 60 seconds) since it involves multiple DB queries.
- Store analysis results in the **SQLite/PostgreSQL database** permanently so the same entry is never analyzed twice (already implemented in this system).

---

## 4. How would you protect sensitive journal data?

Journal entries contain private mental health information. Protection strategies:

### Authentication & Authorization
- Implement **JWT (JSON Web Tokens)** based authentication — every API request must include a valid token.
- Users can only access **their own entries** — the backend validates that the `userId` in the token matches the requested `userId`.

### Data Encryption
- **Encrypt journal text at rest** using AES-256 before storing in the database.
- Use **HTTPS/TLS** for all API communication so data is encrypted in transit.

### API Security
- Add **rate limiting** (e.g., express-rate-limit) to prevent abuse — e.g., max 100 requests per 15 minutes per IP.
- Use **helmet.js** to set secure HTTP headers.
- Validate and sanitize all user inputs to prevent SQL injection and XSS attacks.

### Infrastructure
- Store API keys and secrets in **environment variables** — never hardcode them (already done in this system via .env).
- Add `.env` and `database.db` to `.gitignore` so secrets are never pushed to GitHub (already done).
- Regular **database backups** to prevent data loss.

---

## Current Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| LLM | Google Gemini 2.5 Pro |
| HTTP Client | Axios |

---

## API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/journal | Save a new journal entry |
| GET | /api/journal/:userId | Get all entries for a user |
| POST | /api/journal/analyze | Analyze emotion using LLM |
| GET | /api/journal/insights/:userId | Get insights summary |