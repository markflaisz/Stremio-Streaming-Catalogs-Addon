# Stremio Streaming Catalogs Addon

Streaming catalogs (Netflix, Disney+, HBO Max, Apple TV+ and more) in Stremio with country filtering, Netflix Top 10, and a Vue-based configurator.

---

## ❗ Root Cause

Stremio does not provide country-specific streaming catalogs out of the box.
This addon pulls provider catalogs from JustWatch and exposes them in Stremio,
including country-based filtering and Netflix Top 10 lists.

---

## 🧪 Tested Environment

- Tested on `arm64` systems and within `CasaOS`.
- `amd64` images are built and available.

---

## 🛠️ Installation – CasaOS (Docker Compose)

1. In CasaOS, click the **`+`** icon in the top-right corner → select **Custom Install**.
2. In the new window, click **Import** (top-right corner).
3. Paste the contents of the `docker-compose.yml` file from this repository.
4. Set the **environment variables** correctly.

---

## 🐳 Installation – Docker CLI

```bash
docker run -d \
  --name stremio-catalog \
  --network bridge \
  --restart unless-stopped \
  -e LOCAL_IP=192.168.0.2 \
  -e PORT=7700 \
  -e HTTPS_PORT=8443 \
  -e USE_CACHE=true \
  -e REFRESH_INTERVAL=6 \
  markflaisz/stremio-catalog:latest
```

---

## 🔐 Environment Variables

| Variable          | Description |
|------------------|-------------|
| `LOCAL_IP`        | Local IP for HTTPS domain (e.g. `192.168.0.2`). |
| `CUSTOM_DOMAIN`   | Custom domain (port ignored, `HTTPS_PORT` is used). |
| `PORT`            | HTTP port (default: 7700). |
| `HTTPS_PORT`      | HTTPS port (default: 8443). |
| `USE_CACHE`       | Enable cache (`true`/`false`). |
| `REFRESH_INTERVAL`| Cache refresh in hours (e.g. `6`). |

---

## 🧾 License & Credits

This addon is based on the original Stremio Streaming Catalogs Addon by [rleroi](https://github.com/rleroi).  
It has been customized and extended for local HTTPS, country logic, and UI changes.
