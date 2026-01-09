import app, { startCatalogLoading } from './src/server/index.js';
import { serveHTTPS } from './src/server/https.js';

const port = process.env.PORT || 7700;
const httpsPort = process.env.HTTPS_PORT || 8443;
const localIp = process.env.LOCAL_IP || '';
const customDomain = process.env.CUSTOM_DOMAIN || '';

if (customDomain) {
  console.log(`HTTPS server not started: custom domain in use (${customDomain})`);
} else {
  await serveHTTPS(app, httpsPort, localIp, customDomain);
}

app.listen(port, () => {
  const httpHost = localIp || '127.0.0.1';
  console.log(`HTTP addon listening on: ${httpHost} : ${port}`);
  startCatalogLoading();
});
