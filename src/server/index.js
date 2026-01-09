import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import justwatch from '../services/justwatch.js';
import { loadCatalogCache, saveCatalogCache, clearCatalogCache } from '../utils/cache.js';
import { handleConfiguredManifest, handleDefaultManifest } from './routes/manifest.js';
import { handleCatalog } from './routes/catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REFRESH_INTERVAL_HOURS = Number(process.env.REFRESH_INTERVAL || 6);
const REFRESH_INTERVAL = REFRESH_INTERVAL_HOURS * 60 * 60 * 1000; // hours to milliseconds
const USE_CACHE = process.env.USE_CACHE !== 'false'; // Default to true

process.on('uncaughtException', function (err) {
  console.error((err && err.stack) ? err.stack : err);
});

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.static(path.join(__dirname, '../../vue/dist')));

const localIp = process.env.LOCAL_IP || '';
const httpsPort = process.env.HTTPS_PORT || 8443;
const customDomain = process.env.CUSTOM_DOMAIN || '';
const httpsHost = localIp ? `${localIp.replace(/\./g, '-')}.local-ip.medicmobile.org` : '';
const ensureCustomPort = (domain) => {
  if (!domain) {
    return domain;
  }
  const withoutProtocol = domain.replace(/^https?:\/\//, '');
  const withoutPort = withoutProtocol.split(':')[0];
  return `${withoutPort}:${httpsPort}`;
};

const httpsBaseUrl = customDomain
  ? (customDomain.startsWith('http://') || customDomain.startsWith('https://')
    ? ensureCustomPort(customDomain)
    : `https://${ensureCustomPort(customDomain)}`)
  : (localIp ? `https://${httpsHost}:${httpsPort}` : '');

// Catalog data storage (country code -> provider id -> metas)
let moviesByCountry = {};
let seriesByCountry = {};

function setCatalog(storage, country, providerId, metas) {
  const key = String(country || 'GLOBAL').toUpperCase();
  if (!storage[key]) {
    storage[key] = {};
  }
  storage[key][providerId] = metas;
}

/**
 * Load catalog data (from cache or fresh fetch)
 */
async function loadNewCatalog() {
  clearCatalogCache();

  // Try to load from cache first (if caching is enabled)
  if (USE_CACHE) {
    const cachedData = loadCatalogCache(REFRESH_INTERVAL);
    if (cachedData) {
      moviesByCountry = cachedData.movies || {};
      seriesByCountry = cachedData.series || {};
      console.log('Catalog data loaded from cache');
      return;
    }
  }
  
  // If no cache or expired, fetch fresh data
  console.log('Fetching fresh catalog data...');
  moviesByCountry = {};
  seriesByCountry = {};
  const movieFetches = [
    { id: 'nfx', country: 'GB' },
    { id: 'nfk', country: 'US' },
    { id: 'dnp', country: 'GB' },
    { id: 'atp', country: 'GB' },
    { id: 'amp', country: 'US' },
    { id: 'pmp', country: 'US' },
    { id: 'hbm', country: 'NL' },
    { id: 'hlu', country: 'US' },
    { id: 'pcp', country: 'US' },
    { id: 'cts', country: 'US' },
    { id: 'mgl', country: 'US' },
    { id: 'cru', country: 'US' },
    { id: 'jhs', country: 'IN', language: 'in' },
    { id: 'zee', country: 'IN', language: 'in' },
    { id: 'vil', country: 'NL', language: 'nl' },
    { id: 'nlz', country: 'NL', language: 'nl' },
    { id: 'sst', country: 'NL', language: 'nl' },
    { id: 'clv', country: 'BR', language: 'br' },
    { id: 'gop', country: 'BR', language: 'br' },
    { id: 'cpd', country: 'FR', language: 'fr' },
    { id: 'stz', country: 'US' },
    { id: 'mbi', country: 'US' },
    { id: 'vik', country: 'US' },
    { id: 'sgo', country: 'DE', language: 'de' },
    { id: 'sonyliv', country: 'IN', language: 'hi' },
    { id: 'mp9', country: 'ES', language: 'es' },
    { id: 'nfx', country: 'HU' },
    { id: 'dnp', country: 'HU' },
    { id: 'atp', country: 'HU' },
    { id: 'amp', country: 'HU', package: 'prv' },
    { id: 'hbm', country: 'HU' },
    { id: 'sst', country: 'HU' },
  ];

  for (const fetchInfo of movieFetches) {
    const packageId = fetchInfo.package || fetchInfo.id;
    const metas = await justwatch.getMetas('MOVIE', [packageId], fetchInfo.country, fetchInfo.language);
    setCatalog(moviesByCountry, fetchInfo.country, fetchInfo.id, metas);
    console.log(`${fetchInfo.id} ${fetchInfo.country} Result: ${metas.length} Movie`);
  }

  const seriesFetches = [
    { id: 'nfx', country: 'GB' },
    { id: 'nfk', country: 'US' },
    { id: 'dnp', country: 'GB' },
    { id: 'atp', country: 'GB' },
    { id: 'hay', country: 'GB' },
    { id: 'dpe', country: 'GB' },
    { id: 'amp', country: 'US' },
    { id: 'pmp', country: 'US' },
    { id: 'hbm', country: 'NL' },
    { id: 'hlu', country: 'US' },
    { id: 'pcp', country: 'US' },
    { id: 'cru', country: 'US' },
    { id: 'cts', country: 'US' },
    { id: 'mgl', country: 'US' },
    { id: 'jhs', country: 'IN', language: 'in' },
    { id: 'zee', country: 'IN', language: 'in' },
    { id: 'vil', country: 'NL', language: 'nl' },
    { id: 'nlz', country: 'NL', language: 'nl' },
    { id: 'sst', country: 'NL', language: 'nl' },
    { id: 'clv', country: 'BR', language: 'br' },
    { id: 'gop', country: 'BR', language: 'br' },
    { id: 'cpd', country: 'FR', language: 'fr' },
    { id: 'stz', country: 'US' },
    { id: 'vik', country: 'US' },
    { id: 'sgo', country: 'DE', language: 'de' },
    { id: 'sonyliv', country: 'IN', language: 'hi' },
    { id: 'mp9', country: 'ES', language: 'es' },
    { id: 'nfx', country: 'HU' },
    { id: 'dnp', country: 'HU' },
    { id: 'atp', country: 'HU' },
    { id: 'amp', country: 'HU', package: 'prv' },
    { id: 'hbm', country: 'HU' },
    { id: 'sst', country: 'HU' },
  ];

  for (const fetchInfo of seriesFetches) {
    const packageId = fetchInfo.package || fetchInfo.id;
    const metas = await justwatch.getMetas('SHOW', [packageId], fetchInfo.country, fetchInfo.language);
    setCatalog(seriesByCountry, fetchInfo.country, fetchInfo.id, metas);
    console.log(`${fetchInfo.id} ${fetchInfo.country} Result: ${metas.length} Series`);
  }

  // Save to cache (if caching is enabled)
  if (USE_CACHE) {
    saveCatalogCache(moviesByCountry, seriesByCountry);
  }
  console.log('done');
}

// Routes
app.get('/:configuration/manifest.json', (req, res) => {
  handleConfiguredManifest(req, res);
});

app.get('/config.json', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('content-type', 'application/json');
  res.send({
    httpsBaseUrl,
    localIp: localIp || null,
    customDomain: customDomain || null,
    httpsPort,
  });
});

app.get('/manifest.json', (req, res) => {
  handleDefaultManifest(req, res);
});

app.get('/:configuration?/catalog/:type/:id/:extra?.json', (req, res) => {
  handleCatalog(req, res, moviesByCountry, seriesByCountry);
});

// Fallback to Vue
app.get(/.*/, (req, res) => {
  res.setHeader('Cache-Control', 'max-age=86400,stale-while-revalidate=86400,stale-if-error=86400,public');
  res.setHeader('content-type', 'text/html');
  res.sendFile(path.join(__dirname, '../../vue/dist/index.html'));
});

export function startCatalogLoading() {
  loadNewCatalog();
  setInterval(loadNewCatalog, REFRESH_INTERVAL);
}

export default app;
