import axios from 'axios';
import https from 'https';

export async function serveHTTPS(app, port, localIp, customDomain) {
  if (!localIp) {
    console.log('HTTPS server not started: missing LOCAL_IP or CUSTOM_DOMAIN');
    return null;
  }

  const json = (await axios.get('https://local-ip.medicmobile.org/keys')).data;
  const cert = `${json.cert}\n${json.chain}`;
  const httpsServer = https.createServer({ key: json.privkey, cert }, app);
  httpsServer.listen(port);
  const httpsHost = `${localIp.replace(/\./g, '-')}.local-ip.medicmobile.org`;
  console.log(`HTTPS addon listening on: ${httpsHost}:${port}`);
  return httpsServer;
}
