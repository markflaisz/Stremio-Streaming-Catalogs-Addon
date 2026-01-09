/**
 * Manifest route handlers
 */

/**
 * Build catalog list from selected providers
 */
function buildProviderCatalogs(selectedProviders) {
  const catalogs = [];
  
  const providerMap = {
    'nfx': { name: 'Netflix', types: ['movie', 'series'] },
    'nfk': { name: 'Netflix Kids', types: ['movie', 'series'] },
    'hbm': { name: 'HBO Max', types: ['movie', 'series'] },
    'dnp': { name: 'Disney+', types: ['movie', 'series'] },
    'hlu': { name: 'Hulu', types: ['movie', 'series'] },
    'amp': { name: 'Prime Video', types: ['movie', 'series'] },
    'pmp': { name: 'Paramount+', types: ['movie', 'series'] },
    'atp': { name: 'Apple TV+', types: ['movie', 'series'] },
    'pcp': { name: 'Peacock', types: ['movie', 'series'] },
    'pct': { name: 'Peacock', types: ['movie', 'series'] }, // Legacy alias
    'cru': { name: 'Crunchyroll', types: ['movie', 'series'] },
    'fmn': { name: 'Crunchyroll', types: ['movie', 'series'] }, // Legacy alias
    'jhs': { name: 'JioHotstar', types: ['movie', 'series'] },
    'hst': { name: 'JioHotstar', types: ['movie', 'series'] }, // Legacy alias
    'zee': { name: 'Zee5', types: ['movie', 'series'] },
    'vil': { name: 'Videoland', types: ['movie', 'series'] },
    'clv': { name: 'Clarovideo', types: ['movie', 'series'] },
    'gop': { name: 'Globoplay', types: ['movie', 'series'] },
    'hay': { name: 'Hayu', types: ['series'] },
    'nlz': { name: 'NLZIET', types: ['movie', 'series'] },
    'sst': { name: 'SkyShowtime', types: ['movie', 'series'] },
    'mgl': { name: 'MagellanTV', types: ['movie', 'series'] },
    'cts': { name: 'Curiosity Stream', types: ['movie', 'series'] },
    'cpd': { name: 'Canal+', types: ['movie', 'series'] },
    'stz': { name: 'Starz', types: ['movie', 'series'] },
    'dpe': { name: 'Discovery+', types: ['series'] },
    'mbi': { name: 'Mubi', types: ['movie'] },
    'vik': { name: 'Rakuten Viki', types: ['movie', 'series'] },
    'sgo': { name: 'Sky Go', types: ['movie', 'series'] },
    'sonyliv': { name: 'Sony Liv', types: ['movie', 'series'] },
    'mp9': { name: 'Movistar+', types: ['movie', 'series'] },
  };

  const seen = new Set();
  
  for (const provider of selectedProviders.split(',')) {
    const providerInfo = providerMap[provider];
    if (providerInfo && !seen.has(provider)) {
      seen.add(provider);
      for (const type of providerInfo.types) {
        const catalogId = provider === 'pct' ? 'pcp'
          : provider === 'hst' ? 'jhs'
          : provider === 'fmn' ? 'cru'
          : provider;
        catalogs.push({
          id: catalogId,
          type,
          name: providerInfo.name,
        });
      }
    }
  }

  return catalogs;
}

/**
 * Build Netflix Top 10 catalogs
 */
function buildNetflixTop10Catalogs(netflixTop10Country, netflixTop10CountryCode) {
  const catalogs = [];
  
  const enableNetflixTop10Country = netflixTop10Country === '1';
  const top10CountryCode = netflixTop10CountryCode || null;

  // Add country-specific Netflix Top 10 catalogs based on selected country code
  if (enableNetflixTop10Country && top10CountryCode) {
    const countryCodeUpper = top10CountryCode.toUpperCase();
    catalogs.push({
      id: `netflix-top10-${countryCodeUpper}`,
      type: 'movie',
      name: `Netflix (${countryCodeUpper})`,
    });
    catalogs.push({
      id: `netflix-top10-${countryCodeUpper}`,
      type: 'series',
      name: `Netflix (${countryCodeUpper})`,
    });
  }

  return catalogs;
}

/**
 * Configured manifest route handler
 */
function getLogoUrl(req) {
  const host = req.get('host');
  if (!host) {
    return 'https://www.stremio.com/website/stremio-logo.svg';
  }
  return `${req.protocol}://${host}/stremio.png`;
}

export function handleConfiguredManifest(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('content-type', 'application/json');

  // Parse config
  const rawConfig = req.params?.configuration || '';
  let decodedConfig = '';
  try {
    const normalized = decodeURIComponent(rawConfig)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
    decodedConfig = Buffer(normalized + padding, 'base64').toString('ascii');
  } catch (error) {
    console.log('Config decode error:', error.message);
    decodedConfig = '';
  }
  const configParts = decodedConfig?.split(':');
  let selectedProviders;
  let rpdbKey;
  let countryCode;
  let installedAt;
  let netflixTop10Country;
  let netflixTop10CountryCode;

  if (configParts.length >= 7) {
    [selectedProviders, rpdbKey, countryCode, installedAt, , netflixTop10Country, netflixTop10CountryCode] = configParts;
  } else {
    [selectedProviders, rpdbKey, countryCode, installedAt, netflixTop10Country, netflixTop10CountryCode] = configParts;
  }

  const top10Catalogs = buildNetflixTop10Catalogs(netflixTop10Country, netflixTop10CountryCode);
  const providerCatalogs = buildProviderCatalogs(selectedProviders || '');
  const catalogs = top10Catalogs.length
    ? [...top10Catalogs, ...providerCatalogs]
    : [...providerCatalogs];
  res.send({
    id: 'pw.ers.netflix-catalog',
    logo: getLogoUrl(req),
    version: '0.1.0',
    name: 'Streaming Catalogs',
    description: 'Configure and install streaming catalogs (Netflix, Disney+, HBO Max, Apple TV+ and more) directly in Stremio.',
    catalogs: catalogs,
    resources: ['catalog'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    behaviorHints: {
      configurable: true,
    }
  });
}

/**
 * Default manifest route handler
 */
export function handleDefaultManifest(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('content-type', 'application/json');

  res.send({
    id: 'pw.ers.netflix-catalog',
    logo: getLogoUrl(req),
    version: '0.1.0',
    name: 'Streaming Catalogs',
    description: 'Configure and install streaming catalogs (Netflix, Disney+, HBO Max, Apple TV+ and more) directly in Stremio.',
    catalogs: [
      {
        id: 'nfx',
        type: 'movie',
        name: 'Netflix',
      }, {
        id: 'nfx',
        type: 'series',
        name: 'Netflix',
      }, {
        id: 'hbm',
        type: 'movie',
        name: 'HBO Max',
      }, {
        id: 'hbm',
        type: 'series',
        name: 'HBO Max',
      }, {
        id: 'dnp',
        type: 'movie',
        name: 'Disney+',
      }, {
        id: 'dnp',
        type: 'series',
        name: 'Disney+',
      }, {
        id: 'amp',
        type: 'movie',
        name: 'Prime  Video',
      }, {
        id: 'amp',
        type: 'series',
        name: 'Prime Video',
      }, {
        id: 'atp',
        type: 'movie',
        name: 'Apple TV+',
      }, {
        id: 'atp',
        type: 'series',
        name: 'Apple TV+',
      },
    ],
    resources: ['catalog'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    behaviorHints: {
      configurable: true,
    }
  });
}
