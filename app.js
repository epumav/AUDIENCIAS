const config = window.APP_CONFIG || {};
const state = {
  weekStart: startOfWeek(new Date()),
  accounts: [],
  events: []
};

const $ = (id) => document.getElementById(id);
const weekGrid = $("weekGrid");
const notice = $("notice");

window.addEventListener("load", () => {
  bindUi();
  renderWeek();
  refreshAll();
});

function bindUi() {
  $("prevWeek").addEventListener("click", () => changeWeek(-7));
  $("nextWeek").addEventListener("click", () => changeWeek(7));
  $("todayBtn").addEventListener("click", () => {
    state.weekStart = startOfWeek(new Date());
    refreshAll();
  });
  $("refreshBtn").addEventListener("click", refreshAll);
}

function changeWeek(days) {
  state.weekStart = addDays(state.weekStart, days);
  refreshAll();
}

async function refreshAll() {
  renderWeek();

  if (!config.apiBaseUrl || config.apiBaseUrl.includes("TU-BACKEND")) {
    showNotice("Falta colocar la URL del backend en config.js.");
    $("statusText").textContent = "Backend sin configurar";
    return;
  }

  $("statusText").textContent = "Actualizando eventos…";
  hideNotice();

  try {
    const start = dateKey(state.weekStart);
    const url = `${config.apiBaseUrl.replace(/\/$/, "")}/api/week?start=${encodeURIComponent(start)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Error HTTP ${response.status}`);
    }

    state.accounts = data.accounts || [];
    state.events = data.events || [];
    updateAccountLabels();
    $("statusText").textContent = `${state.events.length} evento${state.events.length === 1 ? "" : "s"} en la semana`;
  } catch (error) {
    state.events = [];
    showNotice(error.message || "No se pudo consultar el backend.");
    $("statusText").textContent = "No se pudieron cargar los calendarios";
  }

  renderWeek();
}

function updateAccountLabels() {
  $("account1Label").textContent = state.accounts[0]?.email || "Cuenta 1";
  $("account2Label").textContent = state.accounts[1]?.email || "Cuenta 2";
}

function renderWeek() {
  weekGrid.innerHTML = "";
  const days = Array.from({ length: 7 }, (_, i) => addDays(state.weekStart, i));
  const todayKey = dateKeyInTimezone(new Date(), config.timezone);

  $("weekTitle").textContent = formatWeekTitle(days[0], days[6]);

  days.forEach(day => {
    const fragment = $("dayTemplate").content.cloneNode(true);
    const column = fragment.querySelector(".day-column");
    const headerName = fragment.querySelector(".day-name");
    const headerNumber = fragment.querySelector(".day-number");
    const eventsBox = fragment.querySelector(".events");

    headerName.textContent = new Intl.DateTimeFormat("es-PE", { weekday: "short" })
      .format(day).replace(".", "");
    headerNumber.textContent = new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit" }).format(day);

    if (dateKey(day) === todayKey) column.classList.add("is-today");

    const dayEvents = state.events
      .filter(event => event.date === dateKey(day))
      .sort((a, b) => String(a.start || "").localeCompare(String(b.start || "")));

    if (!dayEvents.length) {
      const empty = document.createElement("div");
      empty.className = "empty-day";
      empty.textContent = "Sin eventos";
      eventsBox.appendChild(empty);
    } else {
      dayEvents.forEach(event => eventsBox.appendChild(renderEvent(event)));
    }

    weekGrid.appendChild(fragment);
  });
}

function renderEvent(event) {
  const fragment = $("eventTemplate").content.cloneNode(true);
  const card = fragment.querySelector(".event-card");
  const time = fragment.querySelector(".event-time");
  const account = fragment.querySelector(".event-account");
  const title = fragment.querySelector(".event-title");
  const date = fragment.querySelector(".event-date");
  const meetLink = fragment.querySelector(".meet-link");
  const noMeet = fragment.querySelector(".no-meet");

  if (event.accountIndex === 1) card.classList.add("account-2-card");

  time.textContent = event.allDay ? "Todo el día" : formatTimeRange(event.start, event.end);
  account.textContent = event.email || "Cuenta";
  account.title = event.email || "";
  title.textContent = event.title || "Sin título";
  title.title = event.title || "Sin título";
  date.textContent = formatDateLabel(event.date);

  if (event.meet) {
    meetLink.href = event.meet;
    meetLink.classList.remove("hidden");
  } else {
    noMeet.classList.remove("hidden");
  }

  return fragment;
}

function formatTimeRange(start, end) {
  if (!start) return "Hora no disponible";
  const fmt = new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: config.timezone || undefined
  });
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  return endDate ? `${fmt.format(startDate)}–${fmt.format(endDate)}` : fmt.format(startDate);
}

function formatDateLabel(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const value = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(value);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function dateKeyInTimezone(date, timeZone) {
  if (!timeZone) return dateKey(date);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatWeekTitle(start, end) {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();
  const monthYear = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" });

  if (sameMonth) return `${start.getDate()}–${end.getDate()} de ${monthYear.format(start)}`;

  const short = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" });
  if (sameYear) return `${short.format(start)} – ${short.format(end)} de ${end.getFullYear()}`;
  return `${short.format(start)} ${start.getFullYear()} – ${short.format(end)} ${end.getFullYear()}`;
}

function showNotice(message) {
  notice.textContent = message;
  notice.classList.remove("hidden");
}

function hideNotice() {
  notice.classList.add("hidden");
  notice.textContent = "";
}
