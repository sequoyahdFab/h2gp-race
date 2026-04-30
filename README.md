# H2GP Race Control Dashboard

Real-time race data dashboard for hydrogen fuel cell RC car endurance racing.
Built for a 5-person team: 1 strategy reader + 4 data entry students.

## Tech Stack
- **React** — frontend
- **Supabase** — real-time database (all 5 laptops sync instantly)
- **Vercel** — hosting
- **GitHub** — code storage + auto-deploy

---

## Setup Instructions

### 1. Push to GitHub

1. Go to github.com and create a new repository called `h2gp-race`
2. Make it **Public**
3. Do NOT initialize with README (we already have one)
4. Run these commands in this folder:

```bash
git init
git add .
git commit -m "Initial H2GP Race Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/h2gp-race.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to vercel.com and sign in with GitHub
2. Click **Add New Project**
3. Select your `h2gp-race` repository
4. Leave all settings as default — Vercel auto-detects React
5. Click **Deploy**
6. Your app will be live at `https://h2gp-race.vercel.app` (or similar)

Every time you push to GitHub, Vercel redeploys automatically.

### 3. Share the URL

Send the Vercel URL to all 5 team members. Each person:
1. Opens the URL in their browser
2. Selects or creates the race session
3. Clicks their role tab (Strategy / Lap Timer / Battery / Fuel Cell / Voltage)

---

## Race Day Workflow

### Before the race
1. One person creates a new session with the race config
2. All 5 team members open the URL and select their role tab

### During the race

| Student | Role tab | What they enter |
|---------|----------|-----------------|
| 1 | Strategy | Read-only — watches dashboard, calls strategy |
| 2 | Lap Timer | Lap time (seconds) from LiveRC after each lap |
| 3 | Battery | Battery cap (mAh cumulative) + Battery current (A) from JETI |
| 4 | Fuel Cell | FC cap (mAh cumulative) + FC current (A) from JETI |
| 5 | Voltage | Battery voltage (V) from JETI + H2 stick swap checkbox |

All data syncs to all screens in under 1 second via Supabase Realtime.

### LiveRC auto-import (optional)
On the Lap Timer tab, click "LiveRC" in the header and paste your track's
live results URL. Lap times will auto-import every 5 seconds.

---

## H2 Stick Advisor Logic

The advisor on the Strategy tab monitors:
- **Time on current stick** — warns at 12min, triggers at 16min
- **FC current (3-lap rolling average)** — warns when approaching 1.0A, triggers at ≤1.0A

States:
- 🟢 Hold — stick healthy
- 🟡 Swap soon — time window open AND current dropping
- 🔴 SWAP NOW — time exceeded OR current below trigger

---

## Post-Race
Click **Export CSV** to download all lap data for analysis.
Past sessions are saved permanently in Supabase and accessible from the session selector.
