import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { STATES, CATEGORIES, HERITAGE_ITEMS, FOODS, FESTIVALS, LANGUAGES } from './src/data/seedDatabase.ts';
import { SavedItem, HeritageItem, UserSession } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));
app.use('/assets', express.static(path.resolve(__dirname, 'src/assets')));

// In-memory persistent tables (with SQLite database backing for user login/sessions)
let savedItemsDb: SavedItem[] = [];
let usersDb: UserSession[] = [];

// Helper: Haversine distance
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 1. GET /api/states
app.get('/api/states', (_req, res) => {
  const result = STATES.map(state => {
    const count = HERITAGE_ITEMS.filter(h => h.state_id === state.id).length;
    return { ...state, items_count: count };
  });
  res.json({ success: true, count: result.length, states: result });
});

// 2. GET /api/states/:id
app.get('/api/states/:id', (req, res) => {
  const stateId = req.params.id.toLowerCase();
  const state = STATES.find(s => s.id === stateId || s.name.toLowerCase() === stateId);
  if (!state) {
    return res.status(404).json({ success: false, message: `State '${req.params.id}' not found.` });
  }

  const items = HERITAGE_ITEMS.filter(h => h.state_id === state.id);
  const foods = FOODS.filter(f => f.state_id === state.id);
  const festivals = FESTIVALS.filter(fest => fest.state_id === state.id);
  const languages = LANGUAGES.filter(l => l.state_id === state.id);

  res.json({
    success: true,
    state,
    items,
    foods,
    festivals,
    languages
  });
});

// 3. GET /api/categories
app.get('/api/categories', (_req, res) => {
  res.json({ success: true, count: CATEGORIES.length, categories: CATEGORIES });
});

// 4. GET /api/heritage?state=&category=&q=&period=&sort=
app.get('/api/heritage', (req, res) => {
  const { state, category, q, period, sort } = req.query as {
    state?: string;
    category?: string;
    q?: string;
    period?: string;
    sort?: string;
  };

  let results = [...HERITAGE_ITEMS];

  if (state && state !== 'all') {
    results = results.filter(item => (item.state_id || '').toLowerCase() === state.toLowerCase());
  }

  if (category && category !== 'all') {
    results = results.filter(item => (item.category_id || '').toLowerCase() === category.toLowerCase());
  }

  if (period && period !== 'all') {
    results = results.filter(item => (item.period || '').toLowerCase() === period.toLowerCase());
  }

  if (q && q.trim()) {
    const query = q.toLowerCase().trim();
    results = results.filter(item =>
      (item.title || '').toLowerCase().includes(query) ||
      (item.hindi_title && item.hindi_title.toLowerCase().includes(query)) ||
      (item.summary || '').toLowerCase().includes(query) ||
      (item.location_name || '').toLowerCase().includes(query) ||
      (item.history || '').toLowerCase().includes(query)
    );
  }

  if (sort === 'alpha') {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'unesco') {
    results.sort((a, b) => (b.unesco_flag ? 1 : 0) - (a.unesco_flag ? 1 : 0));
  }

  res.json({
    success: true,
    total: results.length,
    heritage: results
  });
});

// 5. GET /api/heritage/:id
app.get('/api/heritage/:id', (req, res) => {
  const item = HERITAGE_ITEMS.find(h => h.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: `Heritage item '${req.params.id}' not found.` });
  }
  const state = STATES.find(s => s.id === item.state_id);
  const category = CATEGORIES.find(c => c.id === item.category_id);
  res.json({ success: true, item: { ...item, state_name: state?.name, category_name: category?.name } });
});

// 6. GET /api/nearby?lat=&lng=&radius=
app.get('/api/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat((req.query.radius as string) || '500'); // default 500km

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required.' });
  }

  const itemsWithDistance = HERITAGE_ITEMS.map(item => {
    const distance_km = calculateDistanceKm(lat, lng, item.lat, item.lng);
    return { ...item, distance_km };
  })
    .filter(item => item.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json({
    success: true,
    user_coords: { lat, lng },
    radius_km: radius,
    count: itemsWithDistance.length,
    nearby: itemsWithDistance
  });
});

// 7. POST /api/save
app.post('/api/save', (req, res) => {
  const { item_id, session_id } = req.body;
  if (!item_id) {
    return res.status(400).json({ success: false, message: 'item_id is required' });
  }

  const item = HERITAGE_ITEMS.find(h => h.id === item_id);
  if (!item) {
    return res.status(404).json({ success: false, message: `Heritage item '${item_id}' not found.` });
  }

  const userSession = session_id || 'anonymous_guest';
  const existing = savedItemsDb.find(s => s.item_id === item_id && s.user_session_id === userSession);

  if (existing) {
    return res.json({ success: true, message: 'Item already saved', saved: existing });
  }

  const newSaved: SavedItem = {
    id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    item_id,
    user_session_id: userSession,
    created_at: new Date().toISOString(),
    item
  };

  savedItemsDb.push(newSaved);
  res.status(201).json({ success: true, message: 'Item saved successfully', saved: newSaved });
});

// 9. DELETE /api/save/:id
app.delete('/api/save/:id', (req, res) => {
  const idOrItemId = req.params.id;
  const initialLen = savedItemsDb.length;
  savedItemsDb = savedItemsDb.filter(s => s.id !== idOrItemId && s.item_id !== idOrItemId);

  if (savedItemsDb.length === initialLen) {
    return res.status(404).json({ success: false, message: `Saved item '${idOrItemId}' not found.` });
  }

  res.json({ success: true, message: 'Item removed from saved list.' });
});

// 10. GET /api/saved
app.get('/api/saved', (req, res) => {
  const sessionId = (req.query.session_id as string) || 'anonymous_guest';
  const saved = savedItemsDb
    .filter(s => s.user_session_id === sessionId || sessionId === 'all')
    .map(s => ({
      ...s,
      item: HERITAGE_ITEMS.find(h => h.id === s.item_id)
    }));

  res.json({
    success: true,
    count: saved.length,
    saved
  });
});

// 10.1 POST /api/login (Record User Name & Login Timestamp in Database)
app.post('/api/login', (req, res) => {
  const { name, timestamp } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'User name is required for login.' });
  }

  const cleanName = name.trim();
  const loginTime = timestamp || new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const newUser: UserSession = {
    id: String(Date.now()),
    name: cleanName,
    login_time: loginTime
  };

  usersDb.unshift(newUser);

  // Sync to SQLite database using Python helper safely
  try {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const dbScriptPath = path.resolve(__dirname, 'backend', 'database.py');
    execFileSync(pythonCmd, [dbScriptPath, 'save', cleanName, loginTime], { stdio: 'ignore' });
  } catch (err) {
    // Graceful fallback if python process is busy
  }

  res.status(201).json({
    success: true,
    message: `Namaste, ${cleanName}! Login recorded.`,
    user: newUser
  });
});

// 10.2 GET /api/users (Retrieve All User Login Records from Database)
app.get('/api/users', (_req, res) => {
  // Try to read from SQLite database directly via Python
  try {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const dbScriptPath = path.resolve(__dirname, 'backend', 'database.py');
    const output = execFileSync(pythonCmd, [dbScriptPath, 'get_users'], { encoding: 'utf-8' });
    const sqliteUsers = JSON.parse(output.trim());
    if (Array.isArray(sqliteUsers) && sqliteUsers.length > 0) {
      return res.json({ success: true, count: sqliteUsers.length, users: sqliteUsers });
    }
  } catch {
    // fallback to in-memory usersDb
  }

  res.json({ success: true, count: usersDb.length, users: usersDb });
});

// 10.3 POST /api/admin/verify (Verify Administrator Passcode: asi@bharat)
app.post('/api/admin/verify', (req, res) => {
  const { passcode } = req.body;
  if (passcode === 'asi@bharat') {
    return res.json({
      success: true,
      message: 'Authentication successful. Welcome, ASI Administrator.'
    });
  }
  return res.status(401).json({
    success: false,
    message: 'Invalid Administrative Passcode. Access Denied.'
  });
});

// 11. GET /api/search-suggest?q=
app.get('/api/search-suggest', (req, res) => {
  const query = ((req.query.q as string) || '').trim().toLowerCase();
  if (!query) {
    return res.json({ success: true, suggestions: [] });
  }

  const matchedStates = STATES
    .filter(s => (s.name || '').toLowerCase().includes(query) || (s.hindi_name && s.hindi_name.includes(query)))
    .slice(0, 3)
    .map(s => ({
      id: s.id,
      title: s.name,
      category: 'State / Region',
      state_name: s.region,
      type: 'state' as const,
      unesco: false
    }));

  const matchedHeritage = HERITAGE_ITEMS
    .filter(h =>
      (h.title || '').toLowerCase().includes(query) ||
      (h.hindi_title && h.hindi_title.toLowerCase().includes(query)) ||
      (h.location_name || '').toLowerCase().includes(query)
    )
    .slice(0, 6)
    .map(h => {
      const stateObj = STATES.find(s => s.id === h.state_id);
      const catObj = CATEGORIES.find(c => c.id === h.category_id);
      return {
        id: h.id,
        title: h.title,
        category: catObj?.name || 'Heritage',
        state_name: stateObj?.name || '',
        type: 'heritage' as const,
        unesco: h.unesco_flag
      };
    });

  res.json({
    success: true,
    suggestions: [...matchedStates, ...matchedHeritage]
  });
});

// 12. POST /api/heritage (Admin Dashboard: Add Heritage Entry)
app.post('/api/heritage', (req, res) => {
  try {
    const {
      title,
      hindi_title,
      state_id,
      category_id,
      period,
      location_name,
      summary,
      history,
      culture,
      image_url,
      video_url,
      timings,
      best_time,
      unesco_flag,
      lat,
      lng
    } = req.body;

    if (!title || !summary || !state_id) {
      return res.status(400).json({ success: false, message: 'Title, State, and Summary are required.' });
    }

    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `item_${Date.now()}`;

    const newItem: HeritageItem = {
      id,
      title: title.trim(),
      hindi_title: hindi_title ? hindi_title.trim() : undefined,
      state_id: state_id.toLowerCase().trim(),
      category_id: (category_id || 'monuments').toLowerCase().trim(),
      period: period || 'Medieval',
      location_name: location_name ? location_name.trim() : 'India',
      summary: summary.trim(),
      history: history ? history.trim() : summary.trim(),
      culture: culture ? culture.trim() : summary.trim(),
      image_url: image_url || '/src/assets/images/regenerated_image_1790779565133.png',
      video_url: video_url || '',
      timings: timings || 'Sunrise to Sunset',
      best_time: best_time || 'October to March',
      unesco_flag: Boolean(unesco_flag),
      lat: parseFloat(lat) || 26.9124,
      lng: parseFloat(lng) || 75.7873
    };

    HERITAGE_ITEMS.unshift(newItem);

    res.status(201).json({
      success: true,
      message: 'Heritage entry added to repository.',
      item: newItem
    });
  } catch (err: any) {
    console.error('Error adding heritage entry:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error adding heritage item.' });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Explicit fallback: serve transformed index.html for all non-API GET requests
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`  Bharat Heritage Explorer is Live!`);
    console.log(`  > Local:    http://localhost:${PORT}`);
    console.log(`  > Loopback: http://127.0.0.1:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
