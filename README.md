# 🏛️ Bharat Heritage Explorer (भारत विरासत अन्वेषक)
### Smart India Hackathon 2026 — Problem Statement SIH26197

Bharat Heritage Explorer is an interactive, full-stack cultural preservation and exploration platform for India's monuments, sacred shrines, traditional cuisine, living folklore, classical performing arts, and UNESCO World Heritage sites.

---

## 🚀 Quick Start Guide

### Option 1: Python Flask Backend + SQLite (Auto-Seeded)
```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the application
python app.py
# The server will auto-create heritage.db, seed all tables, and start on http://127.0.0.1:5000
```

### Option 2: Full-Stack Node.js / TypeScript (AI Studio Dev Environment)
```bash
npm install
npm run dev
# Running on http://localhost:3000 with real-time API and Leaflet map
```

### Option 3: One-Command Docker Deployment
```bash
docker build -t bharat-heritage .
docker run -p 5000:5000 bharat-heritage
```

---

## 🗺️ REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/states` | Fetch list of all Indian states with heritage counts |
| `GET` | `/api/states/<id>` | Full state detail with 6+ sub-categories (Overview, Culture, Festivals, Food, Languages, Monuments) |
| `GET` | `/api/categories` | List of cultural categories (Monuments, Temples, Forts, UNESCO, Arts, Festivals, Cuisine) |
| `GET` | `/api/heritage?state=&category=&q=&period=&sort=` | Filtered heritage list with search, period, and UNESCO sorting |
| `GET` | `/api/heritage/<id>` | Detailed heritage item view with historical records, timings, and video |
| `GET` | `/api/nearby?lat=&lng=&radius=` | Haversine distance search based on browser geolocation |
| `GET` | `/api/quiz?category=&n=` | Randomized multi-category cultural heritage quiz with explanations |
| `POST` | `/api/save` | Bookmark item (persists in session & SQLite) |
| `DELETE` | `/api/save/<id>` | Remove item from saved bookmarks |
| `GET` | `/api/saved` | Fetch all saved bookmarks for active session |
| `GET` | `/api/search-suggest?q=` | Debounced live search autocomplete suggestions |

---

## ✅ 15-Point Manual Test Checklist

1. [x] **Database Auto-Seeding**: Verify SQLite `heritage.db` automatically creates tables on first run (`states`, `categories`, `heritage_items`, `foods`, `languages`, `festivals`, `quiz_questions`, `saved_items`).
2. [x] **Interactive Leaflet Map**: Click any state polygon to verify saffron highlight, auto-zoom to bounds, and panel activation.
3. [x] **State Detail Panel**: Inspect all 7 tabs (Overview, Culture, Festivals, Food, Languages, Monuments, Art & Crafts) for loaded state data.
4. [x] **Marker Clustering & Pins**: Verify heritage site pins render at exact coordinates with interactive info popups.
5. [x] **Map Layer Switcher**: Toggle between Street View (OSM), Topographic Terrain, and Carto Light.
6. [x] **Reset View Control**: Click "Reset View" to return map center to all-India perspective.
7. [x] **Geolocation / Nearby Explorer**: Click "Use My Location", grant permission, and verify sites reorder by Haversine distance in km.
8. [x] **Global Search with Autocomplete**: Type letters in search bar (e.g., "fort", "temple", "kerala") to see instant debounced recommendations.
9. [x] **Category Filter Chips**: Filter heritage by "UNESCO Sites", "Forts & Palaces", "Temples", etc.
10. [x] **Period / Chronology Filter**: Filter by Ancient, Medieval, Mughal, Colonial, or Modern eras.
11. [x] **Heritage Detail Modal**: Click any card to view historical timeline, architectural features, timings, and YouTube video embed.
12. [x] **Save / Unsave Heart Toggle**: Click heart icon on cards; verify bookmark state persists across refresh via DB API & localStorage fallback.
13. [x] **Saved Collections Drawer**: Open drawer from top bar to inspect bookmarked monuments and quick-navigate.
14. [x] **Heritage Quiz Game**: Take quiz, verify 15-second countdown timer, immediate answer feedback with explanations, streak counters, and earned badges.
15. [x] **i18n & Theme**: Toggle between English and हिन्दी; toggle Dark Mode and check contrast compliance.
