# Skyline — Weather

A clean, modern weather web app with an animated background. Built with plain
HTML, CSS and JavaScript — no build step, no framework, no API key.

Data comes from the free [Open-Meteo](https://open-meteo.com/) API (forecast +
geocoding).

## Features

- Search any city by name (Open-Meteo geocoding)
- "Use my location" via the browser's geolocation
- Current conditions: temperature, feels-like, humidity, wind, precipitation, sunrise/sunset
- Next 24 hours, hour by hour
- 7-day forecast with highs and lows
- Dynamic animated background that reacts to the weather (rain, snow, clear)

## Run it locally

Because everything is static, you can just open `index.html` in a browser.
For a cleaner experience (and to avoid any CORS quirks), serve it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy with GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Source**, pick **Deploy from a branch**, choose `main` and `/ (root)`.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

```
.
├── index.html        # Markup
├── styles.css        # Dark theme + animated background
├── app.js            # Data fetching + rendering
├── background.js     # Canvas particle effects (rain / snow / clear)
└── README.md
```

## Credits

Weather and geocoding data by [Open-Meteo](https://open-meteo.com/).
