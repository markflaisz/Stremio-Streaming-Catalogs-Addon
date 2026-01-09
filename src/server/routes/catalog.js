import { getNetflixTop10Catalog, getNetflixTop10Global } from '../../services/netflix/resolver.js';
import { replaceRpdbPosters } from '../../lib/stremio.js';

/**
 * Catalog route handler
 */
function decodeConfig(config) {
  try {
    const normalized = decodeURIComponent(config || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(normalized + padding, 'base64').toString('ascii');
  } catch (error) {
    console.log('Config decode error:', error.message);
    return '';
  }
}

function getCatalogByCountry(store, countryCode, providerId) {
  if (!store || !providerId) {
    return [];
  }

  const normalizedCountry = countryCode ? String(countryCode).toUpperCase() : 'US';
  if (normalizedCountry && store[normalizedCountry]?.[providerId]) {
    return store[normalizedCountry][providerId];
  }

  if (store.GLOBAL?.[providerId]) {
    return store.GLOBAL[providerId];
  }

  for (const country of Object.keys(store)) {
    if (store[country]?.[providerId]) {
      return store[country][providerId];
    }
  }

  return [];
}

export function handleCatalog(req, res, moviesByCountry, seriesByCountry) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('content-type', 'application/json');

  // Parse config
  const decodedConfig = decodeConfig(req.params?.configuration || '');
  let [selectedProviders, rpdbKey, countryCode, installedAt] = decodedConfig?.split(':');

  // Handle legacy RPDB key format
  if (String(rpdbKey || '').startsWith('16')) {
    installedAt = rpdbKey;
    rpdbKey = null;
  }

  let id = req.params.id;
  
  // Legacy addon, netflix-only catalog support
  if (id === 'top') {
    id = 'nfx';
  }
  
  // Jio and Hotstar merged - fallback hst to jhs
  if (id === 'hst') {
    id = 'jhs';
  }

  // Handle Netflix Top 10 catalogs
  if (id.startsWith('netflix-top10-')) {
    const isGlobal = id === 'netflix-top10-global';
    const countryCode = isGlobal ? null : id.replace('netflix-top10-', '');
    const type = req.params.type === 'movie' ? 'movies' : 'shows';

    console.log(`Netflix Top 10 request: id=${id}, isGlobal=${isGlobal}, countryCode=${countryCode}, type=${type}`);

    // Use async handler
    (async () => {
      try {
        let metas;
        if (isGlobal) {
          console.log(`Fetching global Netflix Top 10 (${type})`);
          metas = await getNetflixTop10Global(type);
        } else {
          console.log(`Fetching Netflix Top 10 for country ${countryCode} (${type})`);
          metas = await getNetflixTop10Catalog(countryCode, type);
        }
        console.log(`Returning ${metas.length} metas for ${id}`);
        res.send({ metas: replaceRpdbPosters(rpdbKey, metas) });
      } catch (error) {
        console.error(`Error fetching Netflix Top 10 catalog ${id}:`, error.message);
        if (error.stack) {
          console.error(error.stack);
        }
        // Make sure response hasn't been sent yet
        if (!res.headersSent) {
          res.send({ metas: [] });
        }
      }
    })().catch((error) => {
      console.error(`Unhandled error in Netflix Top 10 catalog ${id}:`, error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      if (!res.headersSent) {
        res.send({ metas: [] });
      }
    });
    return;
  }

  // Handle regular provider catalogs
  if (req.params.type === 'movie') {
    const metas = getCatalogByCountry(moviesByCountry, countryCode, id);
    console.log(`Catalog request movie id=${id} country=${countryCode || 'none'} metas=${metas.length}`);
    res.send({ metas: replaceRpdbPosters(rpdbKey, metas) });
    return;
  }

  if (req.params.type === 'series') {
    const metas = getCatalogByCountry(seriesByCountry, countryCode, id);
    console.log(`Catalog request series id=${id} country=${countryCode || 'none'} metas=${metas.length}`);
    res.send({ metas: replaceRpdbPosters(rpdbKey, metas) });
    return;
  }
}
