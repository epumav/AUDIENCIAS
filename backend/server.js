require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TIMEZONE = process.env.TIMEZONE || "America/Lima";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !FRONTEND_ORIGIN || origin === FRONTEND_ORIGIN) return callback(null, true);
    return callback(new Error("Origen no permitido"));
  },
  methods: ["GET"]
}));

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function oauthClient(refreshToken) {
  const client = new google.auth.OAuth2(
    required("GOOGLE_CLIENT_ID"),
    required("GOOGLE_CLIENT_SECRET")
  );
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

function accountConfig(index) {
  const number = index + 1;
  return {
    index,
    email: required(`CORREO_${number}`),
    refreshToken: required(`REFRESH_TOKEN_${number}`)
  };
}

function extractMeet(event) {
  if (event.hangoutLink) return event.hangoutLink;
  const points = event.conferenceData?.entryPoints || [];
  const video = points.find(p => p.entryPointType === "video" && p.uri);
  return video?.uri || null;
}

function dateKeyInTimezone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function normalizeEvent(event, account) {
  const allDay = Boolean(event.start?.date && !event.start?.dateTime);
  const start = event.start?.dateTime || null;
  const end = event.end?.dateTime || null;
  const date = allDay
    ? event.start.date
    : dateKeyInTimezone(new Date(event.start.dateTime), TIMEZONE);

  return {
    accountIndex: account.index,
    email: account.email,
    title: event.summary?.trim() || "Sin título",
    date,
    start,
    end,
    allDay,
    meet: extractMeet(event)
  };
}

async function fetchAccountWeek(account, timeMin, timeMax) {
  const auth = oauthClient(account.refreshToken);
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 2500
  });
  return (response.data.items || []).map(event => normalizeEvent(event, account));
}

function parseWeekStart(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/week", async (req, res) => {
  try {
    const weekStart = parseWeekStart(req.query.start);
    if (!weekStart) {
      return res.status(400).json({ error: "Parámetro start inválido. Usa YYYY-MM-DD." });
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const timeMin = weekStart.toISOString();
    const timeMax = weekEnd.toISOString();
    const accounts = [accountConfig(0), accountConfig(1)];

    const results = await Promise.all(accounts.map(a => fetchAccountWeek(a, timeMin, timeMax)));
    const events = results.flat().sort((a, b) => {
      const aa = a.start || `${a.date}T00:00:00Z`;
      const bb = b.start || `${b.date}T00:00:00Z`;
      return aa.localeCompare(bb);
    });

    res.set("Cache-Control", "no-store");
    res.json({
      accounts: accounts.map(a => ({ email: a.email })),
      events
    });
  } catch (error) {
    console.error(error);
    const googleMessage = error?.response?.data?.error?.message;
    res.status(500).json({
      error: googleMessage || error.message || "No se pudieron consultar los calendarios."
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(403).json({ error: "Solicitud no permitida." });
});

app.listen(PORT, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
});
