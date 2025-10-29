// Minimal Express server to serve static SPA and global settings API (ESM)
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Prefer mounted volume
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDataDir = '/data';
const dataDir = fs.existsSync(defaultDataDir) ? defaultDataDir : path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
}
const configPath = path.join(dataDir, 'config.json');

const defaultConfig = { provider: 'gemini', model: 'gemini-2.5-flash' };

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const json = JSON.parse(raw);
      return { ...defaultConfig, ...json };
    }
  } catch {}
  return { ...defaultConfig };
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

// API: read global settings
app.get('/api/settings', (req, res) => {
  const cfg = loadConfig();
  res.json({ provider: cfg.provider, model: cfg.model });
});

// API: update global settings (admin only)
app.post('/api/settings', (req, res) => {
  const { password, provider, model } = req.body || {};
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const allowed = ['gemini', 'openrouter', 'mlx'];
  const next = loadConfig();
  if (provider && allowed.includes(String(provider))) next.provider = String(provider);
  if (typeof model === 'string' && model.length > 0) next.model = model;
  if (!saveConfig(next)) return res.status(500).json({ error: 'Failed to persist config' });
  return res.json({ provider: next.provider, model: next.model });
});

// Static files
const distDir = path.join(__dirname, 'dist');
app.use(express.static(distDir, { index: 'index.html', fallthrough: true }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
