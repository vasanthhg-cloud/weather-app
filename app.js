/* Skyline — a small weather app on top of the free Open-Meteo API.
   No API key required. */

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const el = (id) => document.getElementById(id);

const ui = {
  form: el("searchForm"),
  input: el("searchInput"),
  geo: el("geoBtn"),
  status: el("status"),
  current: el("current"),
  hourlyPanel: el("hourlyPanel"),
  dailyPanel: el("dailyPanel"),
  city: el("cityName"),
  time: el("localTime"),
  icon: el("currentIcon"),
  temp: el("currentTemp"),
  desc: el("currentDesc"),
  feels: el("currentFeels"),
  humidity: el("mHumidity"),
  wind: el("mWind"),
  precip: el("mPrecip"),
  sun: el("mSun"),
  hourly: el("hourly"),
  daily: el("daily"),
};

/* WMO weather codes -> { label, day icon, night icon } */
const WMO = {
  0:  ["Clear sky", "☀️", "🌙"],
  1:  ["Mainly clear", "🌤️", "🌙"],
  2:  ["Partly cloudy", "⛅", "☁️"],
  3:  ["Overcast", "☁️", "☁️"],
  45: ["Fog", "🌫️", "🌫️"],
  48: ["Rime fog", "🌫️", "🌫️"],
  51: ["Light drizzle", "🌦️", "🌦️"],
  53: ["Drizzle", "🌦️", "🌦️"],
  55: ["Dense drizzle", "🌧️", "🌧️"],
  56: ["Freezing drizzle", "🌧️", "🌧️"],
  57: ["Freezing drizzle", "🌧️", "🌧️"],
  61: ["Light rain", "🌦️", "🌦️"],
  63: ["Rain", "🌧️", "🌧️"],
  65: ["Heavy rain", "🌧️", "🌧️"],
  66: ["Freezing rain", "🌧️", "🌧️"],
  67: ["Freezing rain", "🌧️", "🌧️"],
  71: ["Light snow", "🌨️", "🌨️"],
  73: ["Snow", "❄️", "❄️"],
  75: ["Heavy snow", "❄️", "❄️"],
  77: ["Snow grains", "🌨️", "🌨️"],
  80: ["Rain showers", "🌦️", "🌦️"],
  81: ["Rain showers", "🌧️", "🌧️"],
  82: ["Violent showers", "⛈️", "⛈️"],
  85: ["Snow showers", "🌨️", "🌨️"],
  86: ["Snow showers", "❄️", "❄️"],
  95: ["Thunderstorm", "⛈️", "⛈️"],
  96: ["Thunderstorm, hail", "⛈️", "⛈️"],
  99: ["Thunderstorm, hail", "⛈️", "⛈️"],
};

function codeInfo(code, isDay = 1) {
  const entry = WMO[code] || ["—", "❓", "❓"];
  return { label: entry[0], icon: isDay ? entry[1] : entry[2] };
}

function setStatus(msg, isError = false) {
  ui.status.textContent = msg || "";
  ui.status.classList.toggle("status--error", Boolean(isError));
}

function showPanels(show) {
  [ui.current, ui.hourlyPanel, ui.dailyPanel].forEach((n) => (n.hidden = !show));
}

function fmtHour(iso, tz) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", timeZone: tz });
}
function fmtClock(iso, tz) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz });
}
function fmtDay(iso, tz, i) {
  if (i === 0) return "Today";
  return new Date(iso).toLocaleDateString([], { weekday: "short", timeZone: tz });
}

/* ---------------- Data fetching ---------------- */

async function geocode(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results || !data.results.length) {
    throw new Error(`Couldn't find “${name}”. Try another city.`);
  }
  return data.results[0];
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  });
  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Weather service unavailable");
  return res.json();
}

/* ---------------- Rendering ---------------- */

function renderCurrent(place, data) {
  const c = data.current;
  const tz = data.timezone;
  const info = codeInfo(c.weather_code, c.is_day);

  ui.city.textContent = [place.name, place.country].filter(Boolean).join(", ");
  ui.time.textContent = `Local time ${fmtClock(c.time, tz)} · ${data.timezone_abbreviation || tz}`;
  ui.icon.textContent = info.icon;
  ui.temp.textContent = Math.round(c.temperature_2m);
  ui.desc.textContent = info.label;
  ui.feels.textContent = `Feels like ${Math.round(c.apparent_temperature)}°C`;

  ui.humidity.textContent = `${Math.round(c.relative_humidity_2m)}%`;
  ui.wind.textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  ui.precip.textContent = `${c.precipitation} mm`;
  ui.sun.textContent = `${fmtClock(data.daily.sunrise[0], tz)} / ${fmtClock(data.daily.sunset[0], tz)}`;

  updateBackgroundTheme(c.weather_code, c.is_day);
}

function renderHourly(data) {
  const tz = data.timezone;
  const now = new Date(data.current.time);
  const times = data.hourly.time;
  // find the index at/after now
  let start = times.findIndex((t) => new Date(t) >= now);
  if (start < 0) start = 0;

  const frag = document.createDocumentFragment();
  for (let i = start; i < Math.min(start + 24, times.length); i++) {
    const info = codeInfo(data.hourly.weather_code[i], data.hourly.is_day[i]);
    const div = document.createElement("div");
    div.className = "hour";
    div.innerHTML = `
      <span class="hour__time">${i === start ? "Now" : fmtHour(times[i], tz)}</span>
      <span class="hour__icon">${info.icon}</span>
      <span class="hour__temp">${Math.round(data.hourly.temperature_2m[i])}°</span>`;
    frag.appendChild(div);
  }
  ui.hourly.replaceChildren(frag);
}

function renderDaily(data) {
  const tz = data.timezone;
  const frag = document.createDocumentFragment();
  data.daily.time.forEach((iso, i) => {
    const info = codeInfo(data.daily.weather_code[i], 1);
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `
      <span class="day__name">${fmtDay(iso, tz, i)}</span>
      <span class="day__icon" title="${info.label}">${info.icon}</span>
      <span class="day__temps">
        <span class="day__max">${Math.round(data.daily.temperature_2m_max[i])}°</span>
        <span class="day__min">${Math.round(data.daily.temperature_2m_min[i])}°</span>
      </span>`;
    frag.appendChild(div);
  });
  ui.daily.replaceChildren(frag);
}

/* ---------------- Orchestration ---------------- */

async function loadByCoords(lat, lon, place) {
  try {
    setStatus("Fetching weather…");
    const data = await fetchWeather(lat, lon);
    renderCurrent(place, data);
    renderHourly(data);
    renderDaily(data);
    showPanels(true);
    setStatus("");
  } catch (err) {
    setStatus(err.message || "Something went wrong.", true);
  }
}

async function searchCity(name) {
  if (!name.trim()) return;
  try {
    setStatus(`Searching “${name}”…`);
    const place = await geocode(name.trim());
    await loadByCoords(place.latitude, place.longitude, {
      name: place.name,
      country: place.country_code || place.country,
    });
  } catch (err) {
    setStatus(err.message || "Search failed.", true);
  }
}

/* ---------------- Events ---------------- */

ui.form.addEventListener("submit", (e) => {
  e.preventDefault();
  searchCity(ui.input.value);
});

ui.geo.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation isn't supported by this browser.", true);
    return;
  }
  setStatus("Locating…");
  navigator.geolocation.getCurrentPosition(
    (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude, { name: "My location", country: "" }),
    () => setStatus("Location permission denied — search a city instead.", true),
    { timeout: 10000 }
  );
});

/* ---------------- Boot ---------------- */

// A few sensible defaults, then the visitor's first visit uses one of them.
searchCity("Bengaluru");
