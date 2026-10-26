function resolveApiBase() {
  if (window.API_BASE) return window.API_BASE;
  const backendOrigin = "http://localhost:5000";
  const isLocalFrontend = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const isBackendOrigin = isLocalFrontend && window.location.port === "5000";
  if (window.location.protocol === "file:" || (isLocalFrontend && !isBackendOrigin)) return `${backendOrigin}/api`;
  return "/api";
}

const API_BASE = resolveApiBase();
const AUTH_KEY = "eblood_auth_token";
const USER_KEY = "eblood_auth_user";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUS_OPTIONS = ["Pending", "Accepted", "Completed", "Rejected"];
const INDIA_LOCATIONS = [
  { name: "AIIMS Blood Centre", type: "Blood Bank", city: "Delhi", state: "Delhi", lat: 28.5672, lng: 77.21, groups: ["A+", "B+", "O-", "AB+"], units: 182, phone: "+91 11 2658 8500", address: "Ansari Nagar, New Delhi", open: true },
  { name: "Tata Memorial Blood Bank", type: "Blood Bank", city: "Mumbai", state: "Maharashtra", lat: 19.0048, lng: 72.8422, groups: ["O+", "A-", "B+", "AB-"], units: 134, phone: "+91 22 2417 7000", address: "Parel, Mumbai", open: true },
  { name: "Sassoon General Hospital", type: "Hospital", city: "Pune", state: "Maharashtra", lat: 18.5266, lng: 73.8715, groups: ["A+", "O+", "O-"], units: 78, phone: "+91 20 2612 8000", address: "Pune Station Road, Pune", open: true },
  { name: "Victoria Hospital Blood Bank", type: "Blood Bank", city: "Bengaluru", state: "Karnataka", lat: 12.9635, lng: 77.5739, groups: ["B+", "AB+", "O+"], units: 116, phone: "+91 80 2670 1150", address: "Fort Road, Bengaluru", open: true },
  { name: "Osmania General Hospital", type: "Hospital", city: "Hyderabad", state: "Telangana", lat: 17.3713, lng: 78.4747, groups: ["A+", "B-", "O+"], units: 91, phone: "+91 40 2460 0146", address: "Afzal Gunj, Hyderabad", open: false },
  { name: "Rajiv Gandhi Government Hospital", type: "Hospital", city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2768, groups: ["AB+", "O-", "A-"], units: 88, phone: "+91 44 2530 5000", address: "Park Town, Chennai", open: true },
  { name: "Civil Hospital Ahmedabad", type: "Blood Bank", city: "Ahmedabad", state: "Gujarat", lat: 23.0525, lng: 72.6026, groups: ["A+", "B+", "AB-", "O+"], units: 124, phone: "+91 79 2268 3721", address: "Asarwa, Ahmedabad", open: true },
  { name: "Kolkata Medical Blood Centre", type: "Blood Bank", city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, groups: ["A+", "B+", "O+", "AB+"], units: 104, phone: "+91 33 2227 6000", address: "Salt Lake, Kolkata", open: true },
  { name: "Lucknow Emergency Blood Centre", type: "Blood Bank", city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, groups: ["O-", "A+", "B+", "AB-"], units: 96, phone: "+91 522 262 2080", address: "Gomti Nagar, Lucknow", open: true }
];
const CITY_COORDS = {
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Noida: { lat: 28.5355, lng: 77.391 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Gurugram: { lat: 28.4595, lng: 77.0266 }
};
const REQUIRED_CITY_NAMES = ["Ahmedabad", "Mumbai", "Delhi", "Pune", "Hyderabad", "Chennai", "Kolkata", "Lucknow"];
const CART_KEY = "eblood_marketplace_cart";
const ORDER_KEY = "eblood_current_order";
const ORDER_HISTORY_KEY = "eblood_order_history";
const ORDER_STAGES = ["Requested", "Approved", "Processing", "Ready", "Delivered"];
const RECEIVE_COMPATIBILITY = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": BLOOD_GROUPS
};

let stock = [];
let donors = [];
let hospitals = [];
let requests = [];
let activities = [];
let alerts = [];
let notifications = [];
let analyticsData = null;
let serverNotifications = [];
let users = [];
let selectedFacility = INDIA_LOCATIONS[0];
let stockChart;
let donationChart;
let requestChart;
let dashDonationChart;
let dashRequestChart;
let liveNetworkState = { animId: null, nodes: [], connections: [], width: 0, height: 0, dpr: 1 };
let mapState = { map: null, markers: null, markerByCity: new Map(), selectedCity: "", initialized: false, visibleReady: false, locationRequested: false, locationPromise: null, userMarker: null, accuracyCircle: null, userLocation: null };
let marketplaceCart = [];
let marketplaceState = { items: [] };
let checkoutDraft = null;
let currentOrder = null;
let selectedPaymentMethod = "UPI";
let selectedCompatGroup = "O+";
let selectedProductId = null;
let resizeRaf = null;
let clockTimer = null;

function token() { return sessionStorage.getItem(AUTH_KEY); }
function currentUser() {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}
function saveAuth(auth) {
  sessionStorage.setItem(AUTH_KEY, auth.token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  updateAuthUI(auth.user);
}
function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USER_KEY);
  updateAuthUI(null);
}
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function timeAgo(value) {
  if (!value) return "Just now";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
function showToast(message) {
  const area = document.getElementById("toastArea");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  area.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    window.setTimeout(() => toast.remove(), 200);
  }, 2200);
}
function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}
function readJSON(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
function writeJSON(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}
function restoreCommerceState() {
  marketplaceCart = readJSON(CART_KEY, []);
  currentOrder = readJSON(ORDER_KEY, null);
}
function saveCart() {
  writeJSON(CART_KEY, marketplaceCart);
  renderCart();
}
function saveOrder() {
  if (currentOrder) writeJSON(ORDER_KEY, currentOrder);
}
function stockStatus(item) {
  const units = Number(item.units || 0);
  const threshold = Number(item.lowStockThreshold || 60);
  if (units <= Math.max(20, threshold * 0.45)) return "Critical";
  if (units <= threshold) return "Low";
  return "Healthy";
}
function updateAuthUI(user = currentUser()) {
  const isAuthed = Boolean(user);
  document.body.classList.toggle("is-authed", isAuthed);
  document.querySelectorAll(".auth-guest").forEach((node) => { node.hidden = isAuthed; });
  document.getElementById("logoutBtn").hidden = !isAuthed;
  const displayName = isAuthed && typeof user.name === "string" && user.name.trim() ? user.name.trim() : "";
  document.getElementById("profileName").textContent = displayName || "Guest";
  document.getElementById("profileRole").textContent = isAuthed ? user.role : "Signed out";
  document.getElementById("profileAvatar").textContent = displayName ? displayName.charAt(0).toUpperCase() : "?";
  const firstName = displayName ? displayName.split(/\s+/)[0] : "";
  const topbarName = document.getElementById("topbarAdminName");
  if (topbarName) topbarName.textContent = firstName || "there";
  const dashName = document.getElementById("dashboardAdminName");
  if (dashName) dashName.textContent = firstName || "there";
  const greeting = isAuthed ? getGreeting() : "Welcome Back";
  ["dashboardGreeting", "topbarGreeting"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.textContent = greeting;
  });
}
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}
function updateDateTime() {
  const now = new Date();
  const day = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const stamp = `${day} | ${time}`;
  const greeting = currentUser() ? getGreeting() : "Welcome Back";
  ["topbarDateTime", "dashboardDateTime"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = stamp;
  });
  ["dashboardGreeting", "topbarGreeting"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = greeting;
  });
}
function computeTrend(current, previous) {
  if (!previous) return { text: "+0.0%", positive: true };
  const delta = ((current - previous) / Math.max(previous, 1)) * 100;
  const positive = delta >= 0;
  return { text: `${positive ? "+" : ""}${delta.toFixed(1)}%`, positive };
}
function drawSparkline(canvasId, values, color = "#ff304f") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = 72;
  ctx.clearRect(0, 0, w, h);
  if (!values.length) return;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color.replace(")", ",0.35)").replace("rgb", "rgba").replace("#ff304f", "rgba(255,48,79,0.35)"));
  grad.addColorStop(1, "rgba(255,48,79,0)");
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,48,79,0.12)";
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = (i / (values.length - 1 || 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}
function stockLabel(status) {
  if (status === "Healthy") return "Available";
  if (status === "Low") return "Low";
  return "Critical";
}
function setAuthMode(mode) {
  const selected = mode === "register" ? "register" : "login";
  document.querySelectorAll(".auth-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.authMode === selected));
  document.querySelectorAll(".auth-form").forEach((form) => form.classList.toggle("active", form.id === `${selected}Form`));
}
function openAuthModal(mode = "login") {
  setAuthMode(mode);
  const modal = document.getElementById("authModal");
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}
function closeAuthModal() {
  const modal = document.getElementById("authModal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}
function setView(name) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === `${name}View`));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  document.body.classList.remove("menu-open");
  if (name === "network") requestAnimationFrame(() => { resizeMap(); if (!mapState.locationRequested) requestMapLocation().catch(() => {}); });
  if (name === "analytics" || name === "dashboard") requestAnimationFrame(() => { resizeCharts(); renderCharts(); resizeLiveNetwork(); drawStatSparklines(); });
  if (name === "product" && selectedProductId) renderProductDetail(selectedProductId);
  if (name === "orders") renderOrderHistory();
  if (window.gsap) gsap.from(`#${name}View`, { opacity: 0, y: 12, duration: 0.35, ease: "power2.out" });
}

async function ensureAuth() {
  if (token()) {
    try {
      const profile = await api("/auth/me");
      sessionStorage.setItem(USER_KEY, JSON.stringify(profile.user));
      updateAuthUI(profile.user);
      return;
    } catch {
      clearAuth();
    }
  }
  updateAuthUI(null);
  openAuthModal("login");
  throw new Error("Please login or register to continue");
}
async function loadData() {
  await ensureAuth();
  const [stockResult, donorResult, hospitalResult, requestResult, analyticsResult, notificationResult, usersResult] = await Promise.allSettled([
    api("/blood-stock"),
    api("/donors"),
    api("/hospitals"),
    api("/requests"),
    api("/analytics"),
    api("/notifications"),
    api("/users")
  ]);

  if (stockResult.status === "fulfilled") stock = stockResult.value;
  if (donorResult.status === "fulfilled") donors = donorResult.value;
  if (hospitalResult.status === "fulfilled") hospitals = hospitalResult.value;
  if (requestResult.status === "fulfilled") requests = requestResult.value;
  analyticsData = analyticsResult.status === "fulfilled" ? analyticsResult.value : buildLocalAnalytics();
  serverNotifications = notificationResult.status === "fulfilled" ? notificationResult.value : [];
  users = usersResult.status === "fulfilled" ? usersResult.value : [];

  const criticalFailures = [stockResult, donorResult, hospitalResult, requestResult].filter((result) => result.status === "rejected");
  if (criticalFailures.length > 0) {
    showToast(`Some live data failed to load: ${criticalFailures[0].reason.message}`);
  }
  populateFilters();
  renderAll();
}

function buildLocalAnalytics() {
  return {
    totals: {
      stockUnits: stock.reduce((sum, item) => sum + Number(item.units || 0), 0),
      donors: donors.length,
      hospitals: hospitals.length,
      pendingRequests: requests.filter((item) => item.status === "Pending").length,
      emergencyRequests: requests.filter((item) => item.isEmergency && item.status === "Pending").length
    },
    monthlyDonations: [],
    bloodDistribution: BLOOD_GROUPS.map((group) => ({ group, units: stock.find((item) => item.group === group)?.units || 0 })),
    requestStatistics: STATUS_OPTIONS.map((status) => ({ status, count: requests.filter((item) => item.status === status).length })),
    donorStatistics: BLOOD_GROUPS.map((group) => ({ bloodGroup: group, count: donors.filter((item) => item.bloodGroup === group).length })),
    hospitalStatistics: ["Connected", "Disconnected"].map((status) => ({ status, count: hospitals.filter((item) => item.status === status).length })),
    stateWiseAnalytics: buildStateClusters()
  };
}

function deriveData() {
  alerts = stock.filter((item) => stockStatus(item) !== "Healthy").sort((a, b) => Number(a.units) - Number(b.units));
  activities = [
    ...requests.slice(0, 4).map((item) => ({ title: `${item.status} request`, meta: `${item.patient} needs ${item.bloodGroup} at ${item.hospital}`, time: timeAgo(item.updatedAt), tone: item.status === "Rejected" ? "danger" : "red" })),
    ...donors.slice(0, 2).map((item) => ({ title: "New donor registration", meta: `${item.name}, ${item.bloodGroup}, ${item.city}`, time: timeAgo(item.createdAt), tone: "violet" })),
    ...alerts.slice(0, 3).map((item) => ({ title: `${stockStatus(item)} stock`, meta: `${item.group} has ${item.units} units`, time: timeAgo(item.updatedAt), tone: "danger" }))
  ].slice(0, 8);
  const derivedNotifications = [
    ...alerts.map((item) => ({ title: `${stockStatus(item)} ${item.group} stock`, body: `${item.units} units left. Suggested redistribution from nearby facilities.`, kind: stockStatus(item) })),
    ...requests.filter((item) => item.status === "Pending").map((item) => ({ title: `Pending request: ${item.bloodGroup}`, body: `${item.patient} at ${item.hospital} requires ${item.units} unit(s).`, kind: "Request" })),
    ...donors.slice(0, 2).map((item) => ({ title: "New donor registration", body: `${item.name} is available in ${item.city} for ${item.bloodGroup}.`, kind: "Donor" }))
  ];
  notifications = serverNotifications.length
    ? serverNotifications.map((item) => ({ title: item.title, body: item.message, kind: item.type, severity: item.severity }))
    : derivedNotifications;
}
function renderStats() {
  const totalUnits = stock.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const totalRequests = requests.length;
  const pending = analyticsData?.totals?.pendingRequests ?? requests.filter((item) => item.status === "Pending").length;
  const emergency = analyticsData?.totals?.emergencyRequests ?? requests.filter((item) => item.isEmergency && item.status === "Pending").length;
  const criticalGroups = alerts.filter((item) => stockStatus(item) === "Critical").length;
  const completedRequests = requests.filter((item) => ["Accepted", "Completed"].includes(item.status)).length;
  const readiness = totalRequests ? Math.round((completedRequests / totalRequests) * 100) : 100;
  document.getElementById("totalUnits").textContent = (analyticsData?.totals?.stockUnits ?? totalUnits).toLocaleString("en-IN");
  document.getElementById("hospitalCount").textContent = (analyticsData?.totals?.hospitals ?? hospitals.length).toLocaleString("en-IN");
  document.getElementById("donorCount").textContent = (analyticsData?.totals?.donors ?? donors.length).toLocaleString("en-IN");
  const totalReqEl = document.getElementById("totalRequests");
  if (totalReqEl) totalReqEl.textContent = (analyticsData?.totals?.requests ?? totalRequests).toLocaleString("en-IN");
  const pendingEl = document.getElementById("pendingCount");
  if (pendingEl) pendingEl.textContent = pending.toLocaleString("en-IN");
  document.getElementById("notificationCount").textContent = notifications.length;
  const donutTotal = document.getElementById("donutTotal");
  if (donutTotal) donutTotal.textContent = (analyticsData?.totals?.stockUnits ?? totalUnits).toLocaleString("en-IN");
  updateCartCount();
  const notice = document.getElementById("sidebarNoticeText");
  if (notice) notice.textContent = `You have ${notifications.length} new notification${notifications.length === 1 ? "" : "s"}`;
  const monthUnits = analyticsData?.monthlyDonations?.map((m) => m.units) || [];
  const trends = [
    computeTrend(monthUnits.at(-1) || totalUnits, monthUnits.at(-2) || totalUnits * 0.9),
    computeTrend(donors.length, Math.max(1, donors.length - 2)),
    computeTrend(hospitals.filter((h) => h.status === "Connected").length, Math.max(1, hospitals.length - 1)),
    computeTrend(pending, Math.max(1, pending + 2))
  ];
  [["trendUnits", trends[0]], ["trendDonors", trends[1]], ["trendHospitals", trends[2]], ["trendRequests", { text: trends[3].text, positive: !trends[3].positive }]].forEach(([id, trend]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = trend.text;
    el.classList.toggle("positive", trend.positive);
    el.classList.toggle("negative", !trend.positive);
  });
  const statusText = document.getElementById("networkStatusText");
  if (statusText) statusText.textContent = hospitals.some((h) => h.status === "Connected") ? "Active" : "Limited";
  drawStatSparklines();
}
function renderBloodGroupCards() {
  const container = document.getElementById("bloodGroupCards");
  if (!container) return;
  const items = BLOOD_GROUPS.map((group) => {
    const item = stock.find((row) => row.group === group) || { group, units: 0, color: "#ff304f" };
    return { ...item, status: stockStatus(item) };
  });
  container.innerHTML = items.map((item) => {
    const status = stockStatus(item);
    const label = stockLabel(status);
    return `
    <article class="blood-group-card" style="--group-color:${escapeHtml(item.color || "#ff304f")}">
      <span class="blood-bag" aria-hidden="true">🩸</span>
      <strong>${escapeHtml(item.group)}</strong>
      <span class="units">${Number(item.units || 0).toLocaleString("en-IN")}</span>
      <span class="status-badge badge ${status.toLowerCase()}">${label}</span>
    </article>`;
  }).join("");
}
function renderTopDonors() {
  const container = document.getElementById("topDonors");
  if (!container) return;
  const ranked = donors.filter((d) => d.isActive !== false).slice(0, 5);
  container.innerHTML = ranked.length ? ranked.map((donor) => `
    <div class="top-donor-row">
      <span class="top-donor-avatar">${escapeHtml(donor.name.charAt(0).toUpperCase())}</span>
      <div><strong>${escapeHtml(donor.name)}</strong><span>${timeAgo(donor.updatedAt || donor.createdAt)}</span></div>
      <em>${escapeHtml(donor.bloodGroup)}</em>
    </div>
  `).join("") : `<p class="empty">No donors registered yet.</p>`;
}
const DONATE_COMPATIBILITY = {
  "O-": BLOOD_GROUPS,
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+", "A-", "B-"],
  "AB+": ["AB+"]
};
function renderCompatibility() {
  const container = document.getElementById("compatibilityWidget");
  if (!container) return;
  const receive = RECEIVE_COMPATIBILITY[selectedCompatGroup] || [];
  const donate = DONATE_COMPATIBILITY[selectedCompatGroup] || [];
  container.innerHTML = `
    <div class="compat-group-select" id="compatGroupSelect">
      ${BLOOD_GROUPS.map((g) => `<button type="button" class="${g === selectedCompatGroup ? "active" : ""}" data-compat-group="${g}">${g}</button>`).join("")}
    </div>
    <div class="compat-visual">
      <div class="compat-column">
        <h3>You Can Receive</h3>
        <div class="compat-tags">${receive.map((g) => `<span class="compat-tag">${g}</span>`).join("")}</div>
      </div>
      <div class="compat-drop" aria-hidden="true"></div>
      <div class="compat-column">
        <h3>You Can Donate To</h3>
        <div class="compat-tags">${donate.map((g) => `<span class="compat-tag">${g}</span>`).join("")}</div>
      </div>
    </div>
  `;
}
function renderLiveBloodRequests() {
  const container = document.getElementById("liveBloodRequests");
  if (!container) return;
  const live = requests.slice().sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 8);
  container.innerHTML = live.length ? live.map((item) => {
    const badgeClass = item.status === "Accepted" || item.status === "Completed" ? "accepted" : item.status === "Pending" ? "pending" : String(item.status).toLowerCase();
    const label = item.status === "Accepted" || item.status === "Completed" ? "Approved" : item.status;
    return `
    <tr>
      <td>${escapeHtml(item.hospital)}</td>
      <td><strong class="blood-cell">${escapeHtml(item.bloodGroup)}</strong></td>
      <td>${escapeHtml(item.units)}</td>
      <td>${escapeHtml(timeAgo(item.updatedAt || item.createdAt))}</td>
      <td><span class="badge ${badgeClass}">${escapeHtml(label)}</span></td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" class="empty">No live requests right now.</td></tr>`;
}
function renderLiveHospitalCards() {
  const container = document.getElementById("liveHospitalCards");
  if (!container) return;
  const nodes = getNetworkMarkers().slice(0, 6);
  liveNetworkState.nodes = buildLiveNetworkNodes();
  container.innerHTML = nodes.map((item) => `
    <div class="live-hospital-card">
      <span class="node-indicator ${item.open === false ? "offline" : ""}"></span>
      <div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.city)} • ${escapeHtml(item.type || "Hospital")}</span></div>
      <em>${Number(item.units || 0).toLocaleString("en-IN")} units</em>
    </div>
  `).join("");
  const nodeCount = document.getElementById("networkNodeCount");
  const unitCount = document.getElementById("networkUnitCount");
  if (nodeCount) nodeCount.textContent = getNetworkMarkers().length;
  if (unitCount) unitCount.textContent = getNetworkMarkers().reduce((sum, n) => sum + Number(n.units || 0), 0).toLocaleString("en-IN");
}
const LIVE_NETWORK_LAYOUT = {
  Delhi: { x: 0.52, y: 0.28 },
  Mumbai: { x: 0.28, y: 0.52 },
  Bengaluru: { x: 0.48, y: 0.72 },
  Hyderabad: { x: 0.46, y: 0.58 },
  Chennai: { x: 0.55, y: 0.78 },
  Pune: { x: 0.32, y: 0.58 },
  Ahmedabad: { x: 0.22, y: 0.42 },
  Kolkata: { x: 0.68, y: 0.48 }
};
function buildLiveNetworkNodes() {
  const markers = getNetworkMarkers();
  return markers.map((item, index) => {
    const layout = LIVE_NETWORK_LAYOUT[item.city] || { x: 0.3 + (index % 4) * 0.15, y: 0.3 + Math.floor(index / 4) * 0.2 };
    return { ...item, ...layout, pulse: index * 0.7 };
  });
}
function isDashboardActive() {
  return document.getElementById("dashboardView")?.classList.contains("active");
}
function initLiveNetwork() {
  const canvas = document.getElementById("liveNetworkCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  function draw() {
    if (!isDashboardActive()) {
      liveNetworkState.animId = requestAnimationFrame(draw);
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    if (liveNetworkState.width !== rect.width || liveNetworkState.height !== rect.height || liveNetworkState.dpr !== dpr) {
      liveNetworkState.width = rect.width;
      liveNetworkState.height = rect.height;
      liveNetworkState.dpr = dpr;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, Math.max(w, h) * 0.6);
    bg.addColorStop(0, "rgba(255,48,79,0.08)");
    bg.addColorStop(1, "rgba(5,5,5,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (!liveNetworkState.nodes.length) liveNetworkState.nodes = buildLiveNetworkNodes();
    const hub = liveNetworkState.nodes.find((n) => n.city === "Delhi") || liveNetworkState.nodes[0];
    const hubX = hub ? hub.x * w : w * 0.5;
    const hubY = hub ? hub.y * h : h * 0.35;
    const t = Date.now() / 1000;
    liveNetworkState.nodes.forEach((node, i) => {
      liveNetworkState.nodes.slice(i + 1).forEach((other) => {
        const x1 = node.x * w;
        const y1 = node.y * h;
        const x2 = other.x * w;
        const y2 = other.y * h;
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, "rgba(255,48,79,0.35)");
        grad.addColorStop(0.5, "rgba(255,48,79,0.08)");
        grad.addColorStop(1, "rgba(255,48,79,0.25)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -t * 20;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      });
      if (hub && node !== hub) {
        const x1 = hubX;
        const y1 = hubY;
        const x2 = node.x * w;
        const y2 = node.y * h;
        ctx.strokeStyle = `rgba(255,48,79,${0.15 + Math.sin(t * 2 + node.pulse) * 0.08})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });
    liveNetworkState.nodes.forEach((node) => {
      const x = node.x * w;
      const y = node.y * h;
      const pulse = 1 + Math.sin(t * 3 + node.pulse) * 0.25;
      const radius = (node.open === false ? 5 : 7) * pulse;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 4);
      glow.addColorStop(0, node.open === false ? "rgba(255,176,0,0.6)" : "rgba(255,48,79,0.7)");
      glow.addColorStop(0.4, node.open === false ? "rgba(255,176,0,0.2)" : "rgba(255,48,79,0.25)");
      glow.addColorStop(1, "rgba(255,48,79,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = node.open === false ? "#ffb000" : "#ff304f";
      ctx.shadowColor = node.open === false ? "#ffb000" : "#ff304f";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "600 10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(node.city, x, y - radius - 6);
    });
    liveNetworkState.animId = requestAnimationFrame(draw);
  }
  if (liveNetworkState.animId) cancelAnimationFrame(liveNetworkState.animId);
  draw();
}
function resizeLiveNetwork() {
  const canvas = document.getElementById("liveNetworkCanvas");
  if (!canvas) return;
  const rect = canvas.parentElement?.getBoundingClientRect();
  if (rect) canvas.style.height = `${Math.max(240, rect.width * 0.55)}px`;
}
function renderLegend() {
  const total = Math.max(1, stock.reduce((sum, item) => sum + Number(item.units || 0), 0));
  document.getElementById("stockLegend").innerHTML = stock.map((item) => {
    const pct = Math.round((Number(item.units || 0) / total) * 100);
    return `
    <li>
      <i class="dot" style="background:${escapeHtml(item.color || "#ef0f54")}"></i>
      <strong>${escapeHtml(item.group)}</strong>
      <span>${escapeHtml(item.units)} units</span>
      <em>${pct}%</em>
    </li>`;
  }).join("");
}
function renderActivities() {
  const container = document.getElementById("activityList");
  if (!container) return;
  container.innerHTML = activities.map((item) => `
    <div class="activity ${escapeHtml(item.tone)}"><span></span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.meta)}</small></div><time>${escapeHtml(item.time)}</time></div>
  `).join("") || `<p class="empty">No activity yet.</p>`;
}
function renderStockTable() {
  const query = document.getElementById("stockFilter").value.toLowerCase();
  const statusFilter = document.getElementById("stockStatusFilter").value;
  const rows = stock.filter((item) => {
    const status = stockStatus(item);
    return (!query || `${item.group} ${status}`.toLowerCase().includes(query)) && (!statusFilter || status === statusFilter);
  });
  document.getElementById("stockRows").innerHTML = rows.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.group)}</strong></td>
      <td>${escapeHtml(item.units)}</td>
      <td><span class="badge ${stockStatus(item).toLowerCase()}">${stockStatus(item)}</span></td>
      <td>${escapeHtml(item.lowStockThreshold || 60)}</td>
      <td>${escapeHtml(timeAgo(item.updatedAt))}</td>
      <td class="row-actions"><button data-edit-stock="${item._id}">Edit</button><button data-delete-stock="${item._id}">Delete</button></td>
    </tr>
  `).join("");
}
function renderDonors() {
  const query = document.getElementById("donorFilter").value.toLowerCase();
  const group = document.getElementById("donorGroupFilter").value;
  const rows = donors.filter((donor) => (!query || `${donor.name} ${donor.city} ${donor.bloodGroup} ${donor.phone}`.toLowerCase().includes(query)) && (!group || donor.bloodGroup === group));
  document.getElementById("donorCards").innerHTML = rows.map((donor) => `
    <article class="mini-card glass-panel">
      <span>${escapeHtml(donor.city)}, ${escapeHtml(donor.state || "Delhi")}</span>
      <strong>${escapeHtml(donor.name)}</strong>
      <p>${escapeHtml(donor.bloodGroup)} donor • ${donor.isActive ? "Active" : "Inactive"}</p>
      <p>${escapeHtml(donor.phone)}</p>
      <div class="card-actions"><button data-profile-donor="${donor._id}">Profile</button><button data-edit-donor="${donor._id}">Edit</button><button data-delete-donor="${donor._id}">Delete</button></div>
    </article>
  `).join("") || `<p class="empty">No donors match your filters.</p>`;
}
function renderHospitals() {
  const query = document.getElementById("hospitalFilter").value.toLowerCase();
  const status = document.getElementById("hospitalStatusFilter").value;
  const rows = hospitals.filter((hospital) => (!query || `${hospital.name} ${hospital.area} ${hospital.city}`.toLowerCase().includes(query)) && (!status || hospital.status === status));
  document.getElementById("hospitalCards").innerHTML = rows.map((hospital) => `
    <article class="mini-card glass-panel">
      <span>${escapeHtml(hospital.city)}, ${escapeHtml(hospital.state || "Delhi")}</span>
      <strong>${escapeHtml(hospital.name)}</strong>
      <p>${escapeHtml(hospital.area)} • ${escapeHtml(hospital.status)}</p>
      <p>${escapeHtml(hospital.contactPhone || "Contact pending")}</p>
      <div class="card-actions"><button data-profile-hospital="${hospital._id}">Profile</button><button data-edit-hospital="${hospital._id}">Edit</button><button data-delete-hospital="${hospital._id}">Delete</button></div>
    </article>
  `).join("") || `<p class="empty">No hospitals match your filters.</p>`;
}
function renderRequests() {
  const query = document.getElementById("requestFilter").value.toLowerCase();
  const status = document.getElementById("requestStatusFilter").value;
  const rows = requests.filter((item) => (!query || `${item.patient} ${item.hospital} ${item.bloodGroup}`.toLowerCase().includes(query)) && (!status || item.status === status));
  document.getElementById("requestRows").innerHTML = rows.map((item) => `
    <tr>
      <td>${escapeHtml(item.patient)}</td>
      <td><strong>${escapeHtml(item.bloodGroup)}</strong></td>
      <td>${escapeHtml(item.units)}</td>
      <td>${escapeHtml(item.hospital)}${item.isEmergency ? " • Emergency" : ""}</td>
      <td><span class="badge ${String(item.status).toLowerCase()}">${escapeHtml(item.status)}</span></td>
      <td class="row-actions">
        <button data-status-request="${item._id}" data-status="Accepted">Approve</button>
        <button data-status-request="${item._id}" data-status="Rejected">Reject</button>
        <button data-edit-request="${item._id}">Edit</button>
        <button data-delete-request="${item._id}">Delete</button>
      </td>
    </tr>
  `).join("");
}
function renderNotifications() {
  document.getElementById("notificationList").innerHTML = notifications.map((item) => `
    <article class="notification-item"><span>${escapeHtml(item.kind)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p></article>
  `).join("") || `<p class="empty">No active notifications.</p>`;
}
function renderUsers() {
  const container = document.getElementById("userRows");
  if (!container) return;
  const query = document.getElementById("userFilter")?.value.toLowerCase() || "";
  const role = document.getElementById("userRoleFilter")?.value || "";
  const rows = users.filter((user) => (!query || `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query)) && (!role || user.role === role));
  container.innerHTML = rows.map((user) => `
    <tr>
      <td><strong>${escapeHtml(user.name)}</strong></td>
      <td>${escapeHtml(user.email)}</td>
      <td><span class="badge ${escapeHtml(user.role)}">${escapeHtml(user.role)}</span></td>
      <td>${escapeHtml(timeAgo(user.createdAt))}</td>
      <td class="row-actions"><button data-edit-user="${user._id}">Edit</button><button data-delete-user="${user._id}">Delete</button></td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="empty">No users match your filters, or your role cannot access user management.</td></tr>`;
}
function stableScore(value) {
  return String(value || "").split("").reduce((sum, char) => (sum + char.charCodeAt(0) * 17) % 997, 19);
}
function priceForBloodGroup(group) {
  const rarity = { "O-": 3200, "AB-": 3100, "A-": 2800, "B-": 2800, "AB+": 2600, "O+": 2500, "A+": 2400, "B+": 2400 };
  return rarity[group] || 2400;
}
function availabilityForUnits(units) {
  if (units <= 6) return "Critical";
  if (units <= 18) return "Limited";
  return "Available";
}
function isEmergencyMarketItem(item) {
  return ["O-", "O+", "AB-"].includes(item.group) || item.availability === "Critical";
}
function marketplaceHospitalPool() {
  const connected = hospitals.filter((hospital) => hospital.status === "Connected");
  if (connected.length) return connected;
  return INDIA_LOCATIONS.map((facility, index) => ({
    _id: `fallback-${index}`,
    name: facility.name,
    area: facility.address,
    city: facility.city,
    state: facility.state,
    status: facility.open ? "Connected" : "Disconnected",
    contactPhone: facility.phone
  })).filter((hospital) => hospital.status === "Connected");
}
function getMarketplaceItems() {
  const pool = marketplaceHospitalPool();
  const stockPool = stock.length ? stock : BLOOD_GROUPS.map((group, index) => ({ _id: `stock-${group}`, group, units: 80 - index * 5, color: "#ff304f" }));
  const divisor = Math.max(pool.length, 1);
  return stockPool.flatMap((stockItem) => pool.map((hospital) => {
    const score = stableScore(`${hospital.name}-${stockItem.group}`);
    const factor = 0.54 + (score % 42) / 100;
    const baseUnits = Math.floor(Number(stockItem.units || 0) / divisor);
    const units = Math.max(1, Math.min(Number(stockItem.units || 0), Math.round(baseUnits * factor) || (score % 12) + 4));
    const availability = availabilityForUnits(units);
    return {
      id: `${hospital._id || hospital.name}__${stockItem.group}`,
      group: stockItem.group,
      units,
      hospital: hospital.name,
      hospitalId: hospital._id || "",
      city: hospital.city || "India",
      state: hospital.state || "India",
      price: priceForBloodGroup(stockItem.group),
      availability,
      emergency: ["O-", "O+", "AB-"].includes(stockItem.group) || availability === "Critical",
      contactPhone: hospital.contactPhone || "",
      color: stockItem.color || "#ff304f"
    };
  }));
}
function renderMarketplace() {
  const container = document.getElementById("marketplaceGrid");
  if (!container) return;

  const totalUnits = stock.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const activeHospitals = hospitals.filter((h) => h.status === "Connected").length;
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;
  document.getElementById("marketAvailableUnits").textContent = totalUnits.toLocaleString("en-IN");
  document.getElementById("marketActiveHospitals").textContent = activeHospitals.toLocaleString("en-IN");
  document.getElementById("marketPendingRequests").textContent = pendingRequests.toLocaleString("en-IN");

  const search = document.getElementById("marketSearch").value.toLowerCase();
  const bloodFilter = document.getElementById("marketBloodFilter").value;
  const cityFilter = document.getElementById("marketCityFilter").value;
  const hospitalFilter = document.getElementById("marketHospitalFilter").value;
  const availabilityFilter = document.getElementById("marketAvailabilityFilter").value;
  const emergencyOnly = document.getElementById("marketEmergencyFilter").checked;

  marketplaceState.items = getMarketplaceItems();
  const marketItems = marketplaceState.items.filter((item) => {
    const haystack = `${item.group} ${item.hospital} ${item.city} ${item.state} ${item.availability}`.toLowerCase();
    return (!search || haystack.includes(search))
      && (!bloodFilter || item.group === bloodFilter)
      && (!cityFilter || item.city === cityFilter)
      && (!hospitalFilter || item.hospital === hospitalFilter)
      && (!availabilityFilter || item.availability === availabilityFilter)
      && (!emergencyOnly || isEmergencyMarketItem(item));
  }).slice(0, 72);

  container.innerHTML = marketItems.map((item) => `
    <article class="market-card glass-panel">
      <div class="market-card-header">
        <div>
          <div class="market-card-hospital">${escapeHtml(item.hospital)}</div>
          <div class="market-card-location">${escapeHtml(item.city)} • ${escapeHtml(item.state)}</div>
        </div>
        <span class="market-card-blood">${escapeHtml(item.group)}</span>
      </div>
      <div class="market-card-tags">
        <span class="badge ${item.availability.toLowerCase()}">${escapeHtml(item.availability)}</span>
        ${item.emergency ? `<span class="badge critical">Emergency stock</span>` : ""}
        <strong>${formatCurrency(item.price)} / unit</strong>
      </div>
      <div class="market-card-units">
        <div class="market-card-unit">
          <strong>${Number(item.units || 0).toLocaleString("en-IN")}</strong>
          <span>Units available</span>
        </div>
        <div class="market-card-unit">
          <strong>${formatCurrency(item.units * item.price)}</strong>
          <span>Max stock value</span>
        </div>
      </div>
      <div class="market-card-actions">
        <button class="primary" data-add-cart="${escapeHtml(item.id)}">Add to Cart</button>
        <button data-view-product="${escapeHtml(item.id)}">View Details</button>
      </div>
    </article>
  `).join("") || `<p class="empty marketplace-empty">No blood stock matches your filters. Try adjusting your search criteria.</p>`;
}

function renderRequestTracking() {
  const container = document.getElementById("requestTrackingRows");
  if (!container) return;

  const userRequests = requests.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  container.innerHTML = userRequests.map((item) => `
    <tr>
      <td><strong>${item._id?.slice(-8) || "N/A"}</strong></td>
      <td><strong>${escapeHtml(item.bloodGroup)}</strong></td>
      <td>${escapeHtml(item.units)}</td>
      <td>${escapeHtml(item.hospital)}</td>
      <td><span class="badge ${String(item.status).toLowerCase()}">${escapeHtml(item.status)}</span></td>
      <td>${timeAgo(item.createdAt)}</td>
    </tr>
  `).join("") || `<tr><td colspan="6" class="empty">No requests yet.</td></tr>`;
}
function cartTotals() {
  return marketplaceCart.reduce((totals, item) => {
    totals.units += Number(item.quantity || 0);
    totals.amount += Number(item.quantity || 0) * Number(item.price || 0);
    return totals;
  }, { units: 0, amount: 0 });
}
function updateCartCount() {
  const count = marketplaceCart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const counter = document.getElementById("cartCount");
  if (counter) counter.textContent = count;
  const marketCounter = document.getElementById("marketCartCount");
  if (marketCounter) marketCounter.textContent = count;
}
function getOrderHistory() {
  return readJSON(ORDER_HISTORY_KEY, []);
}
function saveOrderHistory(order) {
  const history = getOrderHistory();
  history.unshift(order);
  writeJSON(ORDER_HISTORY_KEY, history.slice(0, 50));
}
function renderOrderHistory() {
  const container = document.getElementById("orderHistoryRows");
  if (!container) return;
  const localOrders = getOrderHistory();
  const apiRows = requests.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((item) => ({
    id: String(item._id || "").slice(-8) || "REQ",
    patient: item.patient,
    blood: item.bloodGroup,
    units: item.units,
    hospital: item.hospital,
    amount: item.price || Number(item.units) * 2400,
    status: item.status,
    date: item.createdAt,
    trackable: true,
    requestId: item._id
  }));
  const merged = [
    ...localOrders.map((order) => ({
      id: order.id,
      patient: order.patient,
      blood: order.bloodGroups || "Mixed",
      units: order.units,
      hospital: order.hospital,
      amount: order.amount,
      status: ORDER_STAGES[order.statusIndex] || "Requested",
      date: order.createdAt,
      trackable: true,
      orderRef: order.id
    })),
    ...apiRows
  ].slice(0, 30);
  container.innerHTML = merged.length ? merged.map((row) => `
    <tr>
      <td><strong>${escapeHtml(row.id)}</strong></td>
      <td>${escapeHtml(row.patient)}</td>
      <td><strong>${escapeHtml(row.blood)}</strong></td>
      <td>${escapeHtml(row.units)}</td>
      <td>${escapeHtml(row.hospital)}</td>
      <td>${formatCurrency(row.amount)}</td>
      <td><span class="badge ${String(row.status).toLowerCase()}">${escapeHtml(row.status)}</span></td>
      <td>${escapeHtml(timeAgo(row.date))}</td>
      <td>${row.trackable ? `<button type="button" data-track-order="${escapeHtml(row.orderRef || row.requestId || "")}">Track</button>` : ""}</td>
    </tr>
  `).join("") : `<tr><td colspan="9" class="empty">No orders yet. Purchase blood from the marketplace.</td></tr>`;
}
function openProductView(itemId) {
  selectedProductId = itemId;
  renderProductDetail(itemId);
  setView("product");
}
function renderProductDetail(itemId) {
  const item = marketplaceState.items.find((row) => row.id === itemId) || getMarketplaceItems().find((row) => row.id === itemId);
  const container = document.getElementById("productDetail");
  const title = document.getElementById("productTitle");
  if (!container) return;
  if (!item) {
    if (title) title.textContent = "Product Not Found";
    container.innerHTML = `<p class="empty">This blood product is no longer available.</p>`;
    return;
  }
  if (title) title.textContent = `${item.group} — ${item.hospital}`;
  container.innerHTML = `
    <article class="panel glass-panel product-hero">
      <span class="blood-bag-xl" aria-hidden="true">🩸</span>
      <strong style="font-size:32px">${escapeHtml(item.group)}</strong>
      <span class="badge ${item.availability.toLowerCase()}">${escapeHtml(item.availability)}</span>
      ${item.emergency ? `<span class="badge critical">Emergency stock</span>` : ""}
    </article>
    <article class="panel glass-panel product-meta">
      <h2>Product Details</h2>
      <div class="summary-row"><span>Hospital</span><strong>${escapeHtml(item.hospital)}</strong></div>
      <div class="summary-row"><span>Location</span><strong>${escapeHtml(item.city)}, ${escapeHtml(item.state)}</strong></div>
      <div class="summary-row"><span>Available units</span><strong>${Number(item.units).toLocaleString("en-IN")}</strong></div>
      <div class="summary-row"><span>Price per unit</span><strong>${formatCurrency(item.price)}</strong></div>
      <div class="summary-row"><span>Max order value</span><strong>${formatCurrency(item.units * item.price)}</strong></div>
      ${item.contactPhone ? `<div class="summary-row"><span>Contact</span><strong>${escapeHtml(item.contactPhone)}</strong></div>` : ""}
      <div class="product-actions">
        <button class="primary-button" type="button" data-add-cart="${escapeHtml(item.id)}">Add to Cart</button>
        <button class="ghost-button" type="button" data-view="cart">View Cart</button>
        <button class="ghost-button" type="button" data-request-market="${escapeHtml(item.group)}" data-hospital="${escapeHtml(item.hospital)}">Request Allocation</button>
      </div>
    </article>
  `;
}
function drawStatSparklines() {
  const monthUnits = analyticsData?.monthlyDonations?.map((m) => m.units) || [];
  drawSparkline("sparkUnits", monthUnits);
  drawSparkline("sparkDonors", []);
  drawSparkline("sparkHospitals", []);
  drawSparkline("sparkRequests", []);
}
function addToCart(itemId) {
  const source = marketplaceState.items.find((item) => item.id === itemId) || getMarketplaceItems().find((item) => item.id === itemId);
  if (!source) {
    showToast("Inventory item is no longer available");
    return;
  }
  const existing = marketplaceCart.find((item) => item.id === source.id);
  if (existing) {
    existing.quantity = Math.min(existing.available, Number(existing.quantity || 1) + 1);
  } else {
    marketplaceCart.push({
      id: source.id,
      group: source.group,
      hospital: source.hospital,
      city: source.city,
      state: source.state,
      price: source.price,
      available: source.units,
      availability: source.availability,
      quantity: 1
    });
  }
  saveCart();
  renderCheckout();
  showToast(`${source.group} added to cart`);
}
function removeCartItem(itemId) {
  marketplaceCart = marketplaceCart.filter((item) => item.id !== itemId);
  saveCart();
  renderCheckout();
}
function updateCartQuantity(itemId, quantity) {
  const item = marketplaceCart.find((row) => row.id === itemId);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(Number(item.available || 1), Number(quantity || 1)));
  saveCart();
  renderCheckout();
}
function renderCart() {
  updateCartCount();
  const container = document.getElementById("cartItems");
  const totals = cartTotals();
  const totalUnits = document.getElementById("cartTotalUnits");
  const totalAmount = document.getElementById("cartTotalAmount");
  if (totalUnits) totalUnits.textContent = totals.units.toLocaleString("en-IN");
  if (totalAmount) totalAmount.textContent = formatCurrency(totals.amount);
  if (!container) return;
  container.innerHTML = marketplaceCart.length ? marketplaceCart.map((item) => `
    <article class="cart-item">
      <div>
        <strong>${escapeHtml(item.group)} at ${escapeHtml(item.hospital)}</strong>
        <span>${escapeHtml(item.city)}, ${escapeHtml(item.state)} • ${escapeHtml(item.availability)} • ${formatCurrency(item.price)} per unit</span>
      </div>
      <div class="quantity-control">
        <button type="button" data-cart-delta="-1" data-cart-id="${escapeHtml(item.id)}">-</button>
        <input value="${Number(item.quantity || 1)}" min="1" max="${Number(item.available || 1)}" type="number" data-cart-quantity="${escapeHtml(item.id)}">
        <button type="button" data-cart-delta="1" data-cart-id="${escapeHtml(item.id)}">+</button>
      </div>
      <strong>${formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
      <button type="button" data-remove-cart="${escapeHtml(item.id)}">Remove</button>
    </article>
  `).join("") : `<div class="empty empty-state"><strong>Your cart is empty.</strong><span>Add inventory from the Marketplace to start checkout.</span><button type="button" data-open-marketplace="true">Open Marketplace</button></div>`;
}
function canReceiveBlood(recipientGroup, donorGroup) {
  return Boolean(RECEIVE_COMPATIBILITY[recipientGroup]?.includes(donorGroup));
}
function checkoutCompatibility(patientGroup) {
  if (!marketplaceCart.length) return { ok: false, message: "Cart is empty." };
  const incompatible = marketplaceCart.filter((item) => !canReceiveBlood(patientGroup, item.group));
  if (incompatible.length) {
    return {
      ok: false,
      message: `${patientGroup} cannot receive ${incompatible.map((item) => item.group).join(", ")} from the selected cart.`
    };
  }
  return { ok: true, message: `Compatible: ${patientGroup} can receive every selected blood unit.` };
}
function renderCheckout() {
  const totals = cartTotals();
  const units = document.getElementById("checkoutUnits");
  const amount = document.getElementById("checkoutAmount");
  const hospital = document.getElementById("checkoutHospital");
  if (units) units.textContent = totals.units.toLocaleString("en-IN");
  if (amount) amount.textContent = formatCurrency(totals.amount);
  if (hospital && marketplaceCart[0] && !hospital.value) hospital.value = marketplaceCart[0].hospital;
  const form = document.getElementById("checkoutForm");
  const result = document.getElementById("compatibilityResult");
  if (form && result) {
    const patientGroup = form.elements.patientBloodGroup?.value || "A+";
    const validation = checkoutCompatibility(patientGroup);
    result.classList.toggle("is-valid", validation.ok);
    result.classList.toggle("is-invalid", !validation.ok);
    result.textContent = validation.message;
  }
  renderPayment();
}
function renderPayment() {
  const totals = cartTotals();
  const amount = document.getElementById("paymentAmount");
  const method = document.getElementById("selectedPaymentMethod");
  if (amount) amount.textContent = formatCurrency(totals.amount);
  if (method) method.textContent = selectedPaymentMethod;
}
function setPaymentProcessing(active) {
  const processing = document.getElementById("paymentProcessing");
  const pay = document.getElementById("payNowBtn");
  const fail = document.getElementById("simulateFailureBtn");
  if (processing) processing.classList.toggle("active", active);
  if (pay) pay.disabled = active;
  if (fail) fail.disabled = active;
}
async function createOrderRequests() {
  if (!checkoutDraft) throw new Error("Checkout details are missing");
  const created = [];
  for (const item of marketplaceCart) {
    const payload = {
      patient: checkoutDraft.patientName,
      bloodGroup: item.group,
      units: Number(item.quantity || 1),
      hospital: checkoutDraft.hospital || item.hospital,
      state: checkoutDraft.state || item.state,
      isEmergency: checkoutDraft.emergency === "true",
      status: "Pending",
      price: Number(item.price || 0) * Number(item.quantity || 1)
    };
    created.push(await api("/requests", { method: "POST", body: JSON.stringify(payload) }));
  }
  return created;
}
async function processPayment(forceFailure = false) {
  if (!marketplaceCart.length) {
    showToast("Cart is empty");
    setView("marketplace");
    return;
  }
  setPaymentProcessing(true);
  await new Promise((resolve) => window.setTimeout(resolve, 1200));
  if (forceFailure) {
    setPaymentProcessing(false);
    setView("paymentFailure");
    return;
  }
  try {
    const totals = cartTotals();
    const cartSnapshot = marketplaceCart.map((item) => ({ ...item }));
    const createdRequests = await createOrderRequests();
    currentOrder = {
      id: `ORD-${Date.now().toString().slice(-8)}`,
      method: selectedPaymentMethod,
      amount: totals.amount,
      units: totals.units,
      statusIndex: 0,
      createdAt: new Date().toISOString(),
      patient: checkoutDraft.patientName,
      hospital: checkoutDraft.hospital || marketplaceCart[0]?.hospital || "Connected hospital",
      city: checkoutDraft.city || marketplaceCart[0]?.city || "India",
      bloodGroups: cartSnapshot.map((item) => item.group).join(", "),
      requests: createdRequests.map((request) => request._id || request.id || "")
    };
    saveOrder();
    saveOrderHistory({ ...currentOrder });
    marketplaceCart = [];
    checkoutDraft = null;
    saveCart();
    await loadData();
    renderTracking();
    setView("paymentSuccess");
  } catch (error) {
    showToast(error.message);
    setView("paymentFailure");
  } finally {
    setPaymentProcessing(false);
  }
}
function renderTracking() {
  const timeline = document.getElementById("trackingTimeline");
  const summary = document.getElementById("trackingSummary");
  if (!timeline || !summary) return;
  if (!currentOrder) {
    timeline.innerHTML = `<div class="empty empty-state"><strong>No active order.</strong><span>Complete a marketplace checkout to see live tracking.</span><button type="button" data-open-marketplace="true">Open Marketplace</button></div>`;
    summary.innerHTML = `<p class="empty">No allocation order is currently being tracked.</p>`;
    return;
  }
  timeline.innerHTML = ORDER_STAGES.map((stage, index) => {
    const state = index < currentOrder.statusIndex ? "done" : index === currentOrder.statusIndex ? "active" : "pending";
    return `<div class="tracking-step ${state}"><span>${index + 1}</span><div><strong>${stage}</strong><small>${state === "active" ? "Current status" : state === "done" ? "Completed" : "Awaiting update"}</small></div></div>`;
  }).join("");
  summary.innerHTML = `
    <strong>${escapeHtml(currentOrder.id)}</strong>
    <span>${escapeHtml(currentOrder.patient)} • ${Number(currentOrder.units || 0)} unit(s)</span>
    <span>${escapeHtml(currentOrder.hospital)}, ${escapeHtml(currentOrder.city)}</span>
    <span>${formatCurrency(currentOrder.amount)} via ${escapeHtml(currentOrder.method)}</span>
    <em>${escapeHtml(ORDER_STAGES[currentOrder.statusIndex] || ORDER_STAGES[0])}</em>
  `;
}
function advanceOrderStatus() {
  if (!currentOrder) {
    showToast("No order to advance");
    return;
  }
  currentOrder.statusIndex = Math.min(ORDER_STAGES.length - 1, Number(currentOrder.statusIndex || 0) + 1);
  saveOrder();
  renderTracking();
  showToast(`Order ${ORDER_STAGES[currentOrder.statusIndex]}`);
}
function renderNetwork() {
  const markers = getNetworkMarkers();
  const totalCities = new Set(hospitals.map((item) => item.city).filter(Boolean)).size;
  document.getElementById("networkTitle").textContent = `${totalCities || INDIA_LOCATIONS.length} Connected Cities`;
  document.getElementById("networkSummary").textContent = `${donors.length} donor records, ${hospitals.length} hospital records, ${requests.filter((item) => item.isEmergency && item.status === "Pending").length} pending emergency request(s), and live blood movement indicators are loaded from MongoDB.`;
  renderCityPicker();
  document.getElementById("facilityList").innerHTML = markers.map((item) => `
    <button class="facility ${selectedFacility.city === item.city ? "active" : ""}" data-city="${escapeHtml(item.city)}" type="button">
      <strong>${escapeHtml(item.city)} Blood Network</strong>
      <span>${escapeHtml(item.city)}, ${escapeHtml(item.state)} • ${item.hospitals || 1} hospital cluster(s)</span>
      <small>${Number(item.units || 0).toLocaleString("en-IN")} units • ${escapeHtml((item.groups || BLOOD_GROUPS).slice(0, 4).join(", "))} • ${item.open ? "Online" : "Limited"}</small>
    </button>
  `).join("");
}
function buildStateClusters() {
  const byState = new Map();
  const ensureState = (state = "Unknown", city = "India") => {
    const key = state || "Unknown";
    if (!byState.has(key)) {
      byState.set(key, {
        name: `${key} Blood Network`,
        state: key,
        city,
        ...(CITY_COORDS[city] || CITY_COORDS.Delhi),
        donors: 0,
        hospitals: 0,
        requests: 0,
        emergencies: 0,
        units: 0
      });
    }
    return byState.get(key);
  };
  hospitals.forEach((hospital) => {
    const item = ensureState(hospital.state, hospital.city);
    item.hospitals += 1;
    if (!item.city || item.city === "India") item.city = hospital.city;
  });
  donors.forEach((donor) => {
    const item = ensureState(donor.state, donor.city);
    item.donors += 1;
    if (!item.city || item.city === "India") item.city = donor.city;
  });
  requests.forEach((request) => {
    const item = ensureState(request.state, request.hospital);
    item.requests += 1;
    item.units += Number(request.units || 0);
    if (request.isEmergency && request.status === "Pending") item.emergencies += 1;
  });
  const clusters = Array.from(byState.values()).sort((a, b) => (b.hospitals + b.donors + b.requests) - (a.hospitals + a.donors + a.requests));
  return clusters.length ? clusters : INDIA_LOCATIONS.map((item) => ({ ...item, donors: 0, hospitals: 1, requests: 0, emergencies: 0 }));
}
function renderAnalytics() {
  const maxUnits = Math.max(1, ...(analyticsData?.stateWiseAnalytics || []).map((item) => item.units));
  const demand = analyticsData?.stateWiseAnalytics?.length
    ? analyticsData.stateWiseAnalytics.map((item) => [item.state, Math.round((item.units / maxUnits) * 100), item])
    : [];
  document.getElementById("stateDemand").innerHTML = demand.map(([state, value]) => `<div><span>${escapeHtml(state)}</span><b style="width:${value}%"></b><em>${value}%</em></div>`).join("") || `<p class="empty">State demand data is unavailable.</p>`;
  const heatmap = document.getElementById("analyticsHeatmap");
  if (heatmap) {
    heatmap.innerHTML = demand.slice(0, 12).map(([state, value, item]) => `
      <button type="button" style="--heat:${value}%">
        <strong>${escapeHtml(state)}</strong>
        <span>${Number(item?.requests || value).toLocaleString("en-IN")} requests</span>
      </button>
    `).join("") || `<p class="empty">Demand heatmap data is unavailable.</p>`;
  }
  const forecast = document.getElementById("forecastRail");
  if (forecast) {
    const forecastItems = stock.slice().sort((a, b) => Number(a.units) - Number(b.units)).slice(0, 6);
    forecast.innerHTML = forecastItems.map((item, index) => {
      const risk = Math.max(8, 92 - index * 11 - Math.round(Number(item.units || 0) / 35));
      return `<div><span>${escapeHtml(item.group)}</span><b style="height:${Math.min(96, risk)}%"></b><em>${risk}% risk</em></div>`;
    }).join("") || `<p class="empty">Forecast appears after stock data loads.</p>`;
  }
  document.getElementById("hospitalStats").innerHTML = (analyticsData?.hospitalStatistics || []).map((item) => `
    <div><strong>${escapeHtml(item.status)}</strong><span>${item.count} hospital(s)</span></div>
  `).join("") || `<p class="empty">No hospital statistics yet.</p>`;
  document.getElementById("donorStats").innerHTML = (analyticsData?.donorStatistics || []).map((item) => `
    <div><strong>${escapeHtml(item.bloodGroup)}</strong><span>${item.count} donor(s)</span></div>
  `).join("") || `<p class="empty">No donor statistics yet.</p>`;
  document.getElementById("predictionList").innerHTML = stock.slice().sort((a, b) => Number(a.units) - Number(b.units)).slice(0, 5).map((item) => `
    <div><strong>${escapeHtml(item.group)}</strong><span>${stockStatus(item)} risk in ${Math.max(1, Math.round(Number(item.units || 1) / 18))} days</span></div>
  `).join("") || `<p class="empty">Shortage prediction data is unavailable.</p>`;
  renderCharts();
}
function renderAll() {
  deriveData();
  renderStats();
  renderBloodGroupCards();
  renderLegend();
  renderActivities();
  renderStockTable();
  renderDonors();
  renderHospitals();
  renderRequests();
  renderNotifications();
  renderUsers();
  renderNetwork();
  renderAnalytics();
  renderTopDonors();
  renderCompatibility();
  renderLiveBloodRequests();
  renderLiveHospitalCards();
  updateMapMarkers();
  renderMarketplace();
  renderOrderHistory();
  if (window.gsap)
  gsap.from(".stat-card, .panel", {
    opacity: 0,
    y: 10,
    stagger: 0.03,
    duration: 0.35,
    ease: "power2.out"
  });
}

function chartColors(items) {
  return items.map((item) => stock.find((row) => row.group === item.group)?.color || item.color || "#ef0f54");
}
function chartGradient(ctx, colorStart, colorEnd) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
}
function buildChartGradient(canvas, c1, c2) {
  if (!canvas) return c1;
  const ctx = canvas.getContext("2d");
  return chartGradient(ctx, c1, c2);
}
function resizeCharts() {
  [stockChart, donationChart, requestChart, dashDonationChart, dashRequestChart].forEach((chart) => chart?.resize());
}
function renderCharts() {
  if (!window.Chart) {
    drawFallbackCharts();
    return;
  }
  const chartDistribution = analyticsData?.bloodDistribution?.length ? analyticsData.bloodDistribution : stock;
  const colors = chartColors(chartDistribution);
  const monthLabels = analyticsData?.monthlyDonations?.length ? analyticsData.monthlyDonations.map((item) => item.label) : [];
  const monthUnits = analyticsData?.monthlyDonations?.length ? analyticsData.monthlyDonations.map((item) => item.units) : [];
  const requestStats = analyticsData?.requestStatistics?.length ? analyticsData.requestStatistics : STATUS_OPTIONS.map((status) => ({ status, count: requests.filter((item) => item.status === status).length }));
  const common = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: "easeOutQuart" },
    layout: { padding: 6 },
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#a8a0a4", maxRotation: 0, autoSkip: true, font: { size: 11 } }, grid: { color: "rgba(255,48,79,.06)", drawBorder: false } },
      y: { ticks: { color: "#a8a0a4", font: { size: 11 } }, grid: { color: "rgba(255,48,79,.06)", drawBorder: false }, beginAtZero: true }
    }
  };
  const stockCanvas = document.getElementById("stockChart");
  stockChart?.destroy();
  stockChart = new Chart(stockCanvas, {
    type: "doughnut",
    data: {
      labels: chartDistribution.map((item) => item.group),
      datasets: [{
        data: chartDistribution.map((item) => item.units),
        backgroundColor: colors,
        borderColor: "rgba(255,255,255,.12)",
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "68%",
      animation: { animateRotate: true, animateScale: true, duration: 1000 },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: "rgba(10,5,8,.92)", borderColor: "rgba(255,48,79,.3)", borderWidth: 1 } }
    }
  });
  const makeLineChart = (canvas, existing) => {
    existing?.destroy();
    const grad = buildChartGradient(canvas, "rgba(255,48,79,0.45)", "rgba(255,48,79,0.02)");
    return new Chart(canvas, {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [{
          label: "Donation units",
          data: monthUnits,
          borderColor: "#ff304f",
          backgroundColor: grad,
          fill: true,
          tension: 0.45,
          pointRadius: 4,
          pointBackgroundColor: "#ff304f",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }]
      },
      options: common
    });
  };
  const makeBarChart = (canvas, existing) => {
    existing?.destroy();
    const grad = buildChartGradient(canvas, "rgba(255,48,79,0.85)", "rgba(139,10,31,0.6)");
    return new Chart(canvas, {
      type: "bar",
      data: {
        labels: requestStats.map((item) => item.status),
        datasets: [{
          label: "Requests",
          data: requestStats.map((item) => item.count),
          backgroundColor: grad,
          borderRadius: 8,
          maxBarThickness: 52,
          borderSkipped: false
        }]
      },
      options: common
    });
  };
  donationChart = makeLineChart(document.getElementById("donationChart"), donationChart);
  requestChart = makeBarChart(document.getElementById("requestChart"), requestChart);
  dashDonationChart = makeLineChart(document.getElementById("dashDonationChart"), dashDonationChart);
  dashRequestChart = makeBarChart(document.getElementById("dashRequestChart"), dashRequestChart);
  requestAnimationFrame(resizeCharts);
}
function drawFallbackCharts() {
  ["stockChart", "donationChart", "requestChart", "dashDonationChart", "dashRequestChart"].forEach((id) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff304f";
    ctx.font = "14px Inter";
    ctx.fillText("Charts load when Chart.js is available", 24, 42);
  });
}

const INDIA_MAP_BOUNDS = [[8, 68], [37.5, 97.5]];
const INDIA_MAP_LIMITS = [[5.5, 65.5], [39.5, 100]];

function getNetworkMarkers() {
  const byCity = new Map();
  const totalStock = stock.reduce((sum, item) => sum + Number(item.units || 0), 0);
  const addMarker = (facility) => {
    const city = facility.city || "";
    const lat = Number(facility.lat);
    const lng = Number(facility.lng);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
    const existing = byCity.get(city);
    if (!city || (!hasCoordinates && !existing)) return;
    const units = Number(facility.units || facility.stock || 0);
    if (existing) {
      existing.units += units;
      existing.hospitals += facility.type === "Hospital" ? 1 : 0;
      existing.open = existing.open || facility.open !== false;
      existing.names.push(facility.name);
      return;
    }
    byCity.set(city, {
      name: `${city} Blood Network`,
      city,
      state: facility.state || "India",
      type: "City Network",
      lat,
      lng,
      groups: facility.groups || BLOOD_GROUPS,
      units: units || Math.floor(totalStock / Math.max(hospitals.length || INDIA_LOCATIONS.length, 1)),
      phone: facility.phone || facility.contactPhone || "",
      address: facility.address || facility.area || city,
      open: facility.open !== false,
      hospitals: facility.type === "Hospital" ? 1 : 0,
      names: [facility.name]
    });
  };

  INDIA_LOCATIONS.forEach(addMarker);
  hospitals.forEach((hospital) => addMarker({
    ...hospital,
    type: "Hospital",
    open: hospital.status === "Connected",
    units: hospital.stock
  }));

  return Array.from(byCity.values()).sort((a, b) => {
    const rankA = REQUIRED_CITY_NAMES.indexOf(a.city);
    const rankB = REQUIRED_CITY_NAMES.indexOf(b.city);
    if (rankA !== -1 || rankB !== -1) return (rankA === -1 ? 99 : rankA) - (rankB === -1 ? 99 : rankB);
    return a.city.localeCompare(b.city);
  });
}

function mapMarkerIcon(facility, selected = false) {
  const className = `map-marker${facility.open === false ? " closed" : ""}${selected ? " selected" : ""}`;
  return L.divIcon({ className: "", html: `<span class="${className}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] });
}
function fitIndia() {
  if (!mapState.map) return;
  mapState.map.fitBounds(INDIA_MAP_BOUNDS, { padding: [24, 24], maxZoom: 5, animate: true });
  mapState.selectedCity = "";
  renderCityPicker();
}
function mapPopup(facility) {
  return `<div class="map-popup"><strong>${escapeHtml(facility.name || `${facility.city} Blood Network`)}</strong><span>${escapeHtml(facility.city || "India")}, ${escapeHtml(facility.state || "")}</span><small>${escapeHtml(facility.address || facility.area || "Network facility")}</small><small>${Number(facility.units || 0).toLocaleString("en-IN")} units • ${facility.open === false ? "Limited" : "Connected"}</small>${facility.phone ? `<small>${escapeHtml(facility.phone)}</small>` : ""}</div>`;
}
function updateMapMarkers() {
  if (!mapState.map || !window.L) return;
  if (mapState.markers) mapState.markers.clearLayers();
  mapState.markerByCity.clear();
  const facilities = getNetworkMarkers().filter((facility) => Number.isFinite(Number(facility.lat)) && Number.isFinite(Number(facility.lng)));
  if (!facilities.length) {
    document.getElementById("networkSummary").textContent = "No mapped blood banks or hospitals are available yet.";
    return;
  }
  facilities.forEach((facility) => {
    const marker = L.marker([Number(facility.lat), Number(facility.lng)], { icon: mapMarkerIcon(facility, facility.city === mapState.selectedCity) });
    marker.bindPopup(mapPopup(facility));
    marker.on("click", () => selectCity(facility.city));
    mapState.markers.addLayer(marker);
    if (!mapState.markerByCity.has(facility.city)) mapState.markerByCity.set(facility.city, { facility, marker });
  });
  renderCityPicker();
}
function renderCityPicker() {
  const picker = document.getElementById("networkCityPicker");
  if (!picker) return;
  const cities = [...mapState.markerByCity.keys()].filter((city) => REQUIRED_CITY_NAMES.includes(city));
  picker.innerHTML = cities.map((city) => `<button type="button" class="${mapState.selectedCity === city ? "active" : ""}" data-city="${escapeHtml(city)}">${escapeHtml(city)}</button>`).join("");
}
function markSelectedCity(city) {
  mapState.selectedCity = city || "";
  mapState.markerByCity.forEach(({ facility, marker }) => marker.setIcon(mapMarkerIcon(facility, facility.city === mapState.selectedCity)));
  renderCityPicker();
}
function flyToLocation(target, zoom = "city") {
  if (!mapState.map || !target) return;
  const levelZoom = { national: 5, state: 6, city: 9, street: 12 }[zoom] || 9;
  mapState.map.flyTo([Number(target.lat), Number(target.lng)], levelZoom, { duration: 0.8 });
}
function setZoomLevel(level) {
  document.querySelectorAll("#zoomLevels button[data-level]").forEach((node) => node.classList.toggle("active", node.dataset.level === level));
  if (level === "national") return fitIndia();
  const target = selectedFacility || getNetworkMarkers()[0];
  if (target) flyToLocation(target, level);
}
function selectCity(city) {
  const entry = mapState.markerByCity.get(city) || { facility: getNetworkMarkers().find((item) => item.city === city) };
  if (!entry.facility) return;
  selectedFacility = entry.facility;
  markSelectedCity(city);
  if (!document.getElementById("networkView").classList.contains("active")) setView("network");
  flyToLocation(entry.facility, "city");
  renderCityPanel(entry.facility);
  showToast(`${city} city network selected`);
}
function initMap() {
  const container = document.getElementById("indiaMap");
  if (!container || mapState.initialized || !window.L) return;
  mapState.map = L.map(container, { minZoom: 4, maxZoom: 14, maxBounds: INDIA_MAP_LIMITS, maxBoundsViscosity: 1, zoomControl: true, worldCopyJump: false, preferCanvas: true });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener\">OpenStreetMap contributors</a>", maxZoom: 19 }).addTo(mapState.map);
  mapState.markers = L.markerClusterGroup({ showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 44 });
  mapState.map.addLayer(mapState.markers);
  mapState.initialized = true;
  updateMapMarkers();
  fitIndia();
}
function resizeMap() {
  if (!mapState.map) return;
  const container = document.getElementById("indiaMap");
  if (!container || container.clientWidth < 40 || container.clientHeight < 40) {
    if (isNetworkViewActive()) window.requestAnimationFrame(resizeMap);
    return;
  }
  mapState.map.invalidateSize({ pan: false });
  if (!mapState.visibleReady) {
    mapState.visibleReady = true;
    fitIndia();
  }
}
function browserLocationError(error) {
  if (error?.code === 1) return "Location permission was denied. You can still search by city.";
  if (error?.code === 3) return "Location request timed out. You can retry with Use My Location.";
  if (error?.code === 2) return "Your location is currently unavailable. You can retry or search by city.";
  return "Location is unavailable in this browser or connection. You can search by city.";
}
function getBrowserLocation(force = false) {
  if (!force && mapState.userLocation) return Promise.resolve(mapState.userLocation);
  if (!navigator.geolocation) return Promise.reject(new Error("Location is not supported by this browser."));
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 }
    );
  });
}
function showUserLocation(location) {
  if (!mapState.map) return;
  const point = [location.lat, location.lng];
  const icon = L.divIcon({ className: "", html: `<span class="user-location-marker" aria-label="Your current location"></span>`, iconSize: [20, 20], iconAnchor: [10, 10] });
  if (mapState.userMarker) mapState.userMarker.remove();
  if (mapState.accuracyCircle) mapState.accuracyCircle.remove();
  mapState.userMarker = L.marker(point, { icon, zIndexOffset: 1000 }).addTo(mapState.map).bindPopup("Your current location");
  if (Number.isFinite(Number(location.accuracy)) && location.accuracy > 0) {
    mapState.accuracyCircle = L.circle(point, { radius: location.accuracy, color: "#50c8ff", fillColor: "#50c8ff", fillOpacity: 0.1, weight: 1 }).addTo(mapState.map);
  }
  mapState.userLocation = location;
  mapState.map.setView(point, 12, { animate: true });
}
function requestMapLocation(force = false) {
  if (!mapState.map || (!force && mapState.locationRequested)) return mapState.locationPromise;
  mapState.locationRequested = true;
  document.getElementById("networkSummary").textContent = "Requesting your location to center the map. Allow location access when prompted.";
  mapState.locationPromise = getBrowserLocation(force)
    .then((location) => {
      showUserLocation(location);
      document.getElementById("networkSummary").textContent = "Map centered on your current location. Blood bank markers show available network facilities.";
      return location;
    })
    .catch((error) => {
      document.getElementById("networkSummary").textContent = browserLocationError(error);
      showToast(browserLocationError(error));
      fitIndia();
      throw error;
    });
  return mapState.locationPromise;
}

function openEntityModal(title, fields, submitText, onSubmit) {
  const modal = document.getElementById("entityModal");
  const form = document.getElementById("entityForm");
  document.getElementById("entityTitle").textContent = title;
  form.innerHTML = fields.map((field) => {
    const value = escapeHtml(field.value ?? "");
    if (field.type === "select") {
      return `<label>${escapeHtml(field.label)}<select name="${field.name}">${field.options.map((option) => `<option value="${escapeHtml(option)}" ${option === field.value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
    }
    return `<label>${escapeHtml(field.label)}<input name="${field.name}" type="${field.type || "text"}" value="${value}" ${field.required === false ? "" : "required"}></label>`;
  }).join("") + `<button class="primary-button" type="submit">${escapeHtml(submitText)}</button>`;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    await onSubmit(data);
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  };
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}
function donorFields(donor = {}) {
  return [
    { label: "Name", name: "name", value: donor.name },
    { label: "Blood Group", name: "bloodGroup", type: "select", value: donor.bloodGroup || "A+", options: BLOOD_GROUPS },
    { label: "City", name: "city", value: donor.city || "Delhi" },
    { label: "State", name: "state", value: donor.state || "Delhi" },
    { label: "Phone", name: "phone", value: donor.phone || "+91 " }
  ];
}
function hospitalFields(hospital = {}) {
  return [
    { label: "Name", name: "name", value: hospital.name },
    { label: "Area", name: "area", value: hospital.area || "" },
    { label: "City", name: "city", value: hospital.city || "Delhi" },
    { label: "State", name: "state", value: hospital.state || "Delhi" },
    { label: "Status", name: "status", type: "select", value: hospital.status || "Connected", options: ["Connected", "Disconnected"] },
    { label: "Contact Phone", name: "contactPhone", value: hospital.contactPhone || "+91 ", required: false }
  ];
}
function stockFields(item = {}) {
  return [
    { label: "Blood Group", name: "group", type: "select", value: item.group || "A+", options: BLOOD_GROUPS },
    { label: "Units", name: "units", type: "number", value: item.units || 10 },
    { label: "Low Stock Threshold", name: "lowStockThreshold", type: "number", value: item.lowStockThreshold || 60 },
    { label: "Color", name: "color", value: item.color || "#ff304f" }
  ];
}
function requestFields(item = {}) {
  return [
    { label: "Patient", name: "patient", value: item.patient || "Emergency Patient" },
    { label: "Blood Group", name: "bloodGroup", type: "select", value: item.bloodGroup || "O-", options: BLOOD_GROUPS },
    { label: "Units", name: "units", type: "number", value: item.units || 1 },
    { label: "Hospital", name: "hospital", value: item.hospital || hospitals[0]?.name || "Nearest connected hospital" },
    { label: "State", name: "state", value: item.state || "Delhi" },
    { label: "Emergency Request", name: "isEmergency", type: "select", value: String(Boolean(item.isEmergency)), options: ["false", "true"] },
    { label: "Status", name: "status", type: "select", value: item.status || "Pending", options: STATUS_OPTIONS }
  ];
}
function userFields(user = {}) {
  return [
    { label: "Name", name: "name", value: user.name || "" },
    { label: "Email", name: "email", type: "email", value: user.email || "" },
    { label: "Role", name: "role", type: "select", value: user.role || "admin", options: ["admin", "hospital", "donor"] },
    { label: user._id ? "New Password (optional)" : "Password", name: "password", type: "password", value: "", required: !user._id }
  ];
}
function normalizeNumbers(data) {
  ["units", "lowStockThreshold", "price"].forEach((key) => { if (key in data) data[key] = Number(data[key]); });
  return data;
}
function showDonorProfile(id) {
  const donor = donors.find((item) => item._id === id);
  if (!donor) return;
  openEntityModal("Donor Profile", [
    { label: "Name", name: "name", value: donor.name, required: false },
    { label: "History", name: "history", value: `${donor.bloodGroup} donor in ${donor.city}. Last activity ${timeAgo(donor.updatedAt)}. Demo donation history: 3 successful donations.`, required: false }
  ], "Close", async () => { });
}
function showHospitalProfile(id) {
  const hospital = hospitals.find((item) => item._id === id);
  if (!hospital) return;
  openEntityModal("Hospital Profile", [
    { label: "Name", name: "name", value: hospital.name, required: false },
    { label: "Network Summary", name: "summary", value: `${hospital.area}, ${hospital.city}. Status: ${hospital.status}. Demo inventory connected to national network.`, required: false }
  ], "Close", async () => { });
}

function distanceKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function findNearbyBloodBanks() {
  setView("network");
  requestMapLocation(false).then((coords) => {
    const ranked = getNetworkMarkers()
      .filter((item) => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)))
      .map((item) => ({ ...item, distance: distanceKm(coords, item) }))
      .sort((a, b) => a.distance - b.distance);
    document.getElementById("networkTitle").textContent = "Nearby Blood Banks";
    if (!ranked.length) {
      selectedFacility = null;
      document.getElementById("networkSummary").textContent = "No blood banks with valid coordinates are available for nearby search.";
      document.getElementById("facilityList").innerHTML = `<p class="empty">No mapped facilities available.</p>`;
      return;
    }
    selectedFacility = ranked[0];
    document.getElementById("networkSummary").textContent = `Nearby facilities sorted from your current location. Closest: ${selectedFacility.name}, ${selectedFacility.distance.toFixed(1)} km away.`;
    document.getElementById("facilityList").innerHTML = ranked.map((item) => `
      <button class="facility" data-city="${escapeHtml(item.city)}" type="button">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${item.distance.toFixed(1)} km • ${escapeHtml(item.address || item.city)}</span>
        <small>${escapeHtml((item.groups || BLOOD_GROUPS).join(", "))} • ${item.units} units • ${escapeHtml(item.phone || "Network facility")} • ${item.open ? "Open" : "Limited"}</small>
      </button>
    `).join("");
    selectCity(selectedFacility.city);
    showToast("Nearby blood banks sorted by distance");
  }).catch(() => {});
}
function searchNetwork(term) {
  const query = term.trim().toLowerCase();
  if (!query) return renderNetwork();
  const found = getNetworkMarkers().filter((item) => `${item.name} ${item.city} ${item.state} ${(item.groups || BLOOD_GROUPS).join(" ")} ${item.names?.join(" ") || ""}`.toLowerCase().includes(query));
  if (found[0]) {
    selectCity(found[0].city);
    return;
  }
  document.getElementById("networkTitle").textContent = found[0] ? `${found[0].city} View` : "No location found";
  document.getElementById("networkSummary").textContent = found[0] ? `${found.length} matching facilities. Earth camera flying to India demo layer.` : "Try Ahmedabad, Mumbai, Pune, Delhi, Bangalore, Hyderabad, Chennai, or a blood group.";
  document.getElementById("facilityList").innerHTML = found.map((item) => `
    <button class="facility active" data-city="${escapeHtml(item.city)}" type="button"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.city)}, ${escapeHtml(item.state)}</span><small>${escapeHtml((item.groups || BLOOD_GROUPS).join(", "))} • ${item.units} units</small></button>
  `).join("");
}
function drawRoute() {
  const card = document.getElementById("routeCard");
  const dest = selectedFacility || INDIA_LOCATIONS[0];
  const km = Math.round(distanceKm({ lat: 28.6139, lng: 77.209 }, dest));
  card.hidden = false;
  card.innerHTML = `<strong>Route to ${escapeHtml(dest.name)}</strong><span>${km} km • ${Math.max(8, Math.round(km / 34 * 60))} min estimated road travel</span><small>Alternatives: fastest arterial route, hospital corridor, emergency priority route.</small>`;
  showToast("Emergency route generated");
}

function wireEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  document.getElementById("menuButton").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.getElementById("mobileBackdrop").addEventListener("click", () => document.body.classList.remove("menu-open"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") document.body.classList.remove("menu-open");
  });
  document.getElementById("themeToggle").addEventListener("click", () => document.body.classList.toggle("soft-mode"));
  document.getElementById("openLoginBtn").addEventListener("click", () => openAuthModal("login"));
  document.getElementById("openRegisterBtn").addEventListener("click", () => openAuthModal("register"));
  document.getElementById("closeAuthModal").addEventListener("click", closeAuthModal);
  document.getElementById("closeEntityModal").addEventListener("click", () => document.getElementById("entityModal").classList.remove("active"));
  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
  ["authModal", "entityModal"].forEach((id) => document.getElementById(id).addEventListener("click", (event) => { if (event.target.id === id) event.currentTarget.classList.remove("active"); }));

  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    try {
      saveAuth(await api("/auth/login", { method: "POST", body: JSON.stringify(data) }));
      closeAuthModal();
      showToast("Logged in");
      await loadData();
    } catch (error) { showToast(error.message); }
  });
  document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    try {
      saveAuth(await api("/auth/register", { method: "POST", body: JSON.stringify(data) }));
      closeAuthModal();
      event.target.reset();
      showToast("Registered and logged in");
      await loadData();
    } catch (error) { showToast(error.message); }
  });
  document.getElementById("logoutBtn").addEventListener("click", () => { clearAuth(); showToast("Logged out"); openAuthModal("login"); });

  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action;
    if (action === "donor") document.getElementById("addDonorBtn").click();
    if (action === "hospital") document.getElementById("addHospitalBtn").click();
    if (action === "stock") document.getElementById("addStockBtn").click();
    if (action === "request") document.getElementById("addRequestBtn").click();
  }));
  document.getElementById("addDonorBtn").addEventListener("click", () => openEntityModal("Register Donor", donorFields(), "Save Donor", async (data) => { await api("/donors", { method: "POST", body: JSON.stringify(data) }); showToast("Donor saved"); await loadData(); }));
  document.getElementById("addHospitalBtn").addEventListener("click", () => openEntityModal("Connect Hospital", hospitalFields(), "Save Hospital", async (data) => { await api("/hospitals", { method: "POST", body: JSON.stringify(data) }); showToast("Hospital saved"); await loadData(); }));
  document.getElementById("addStockBtn").addEventListener("click", () => openEntityModal("Add Blood Stock", stockFields(), "Save Stock", async (data) => { await api("/blood-stock", { method: "POST", body: JSON.stringify(normalizeNumbers(data)) }); showToast("Stock saved"); await loadData(); }));
  document.getElementById("addRequestBtn").addEventListener("click", () => openEntityModal("Create Blood Request", requestFields(), "Save Request", async (data) => { data.price = Number(data.units) * 2400; await api("/requests", { method: "POST", body: JSON.stringify(normalizeNumbers(data)) }); showToast("Request created"); await loadData(); }));
  document.getElementById("addUserBtn").addEventListener("click", () => openEntityModal("Add User", userFields(), "Save User", async (data) => { await api("/users", { method: "POST", body: JSON.stringify(data) }); showToast("User saved"); await loadData(); }));

  document.body.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;
    try {
      if (target.dataset.editDonor) {
        const donor = donors.find((item) => item._id === target.dataset.editDonor);
        openEntityModal("Edit Donor", donorFields(donor), "Update Donor", async (data) => { await api(`/donors/${donor._id}`, { method: "PUT", body: JSON.stringify(data) }); showToast("Donor updated"); await loadData(); });
      }
      if (target.dataset.deleteDonor && confirm("Delete this donor?")) { await api(`/donors/${target.dataset.deleteDonor}`, { method: "DELETE" }); showToast("Donor deleted"); await loadData(); }
      if (target.dataset.profileDonor) showDonorProfile(target.dataset.profileDonor);
      if (target.dataset.editHospital) {
        const hospital = hospitals.find((item) => item._id === target.dataset.editHospital);
        openEntityModal("Edit Hospital", hospitalFields(hospital), "Update Hospital", async (data) => { await api(`/hospitals/${hospital._id}`, { method: "PUT", body: JSON.stringify(data) }); showToast("Hospital updated"); await loadData(); });
      }
      if (target.dataset.deleteHospital && confirm("Delete this hospital?")) { await api(`/hospitals/${target.dataset.deleteHospital}`, { method: "DELETE" }); showToast("Hospital deleted"); await loadData(); }
      if (target.dataset.profileHospital) showHospitalProfile(target.dataset.profileHospital);
      if (target.dataset.editStock) {
        const item = stock.find((row) => row._id === target.dataset.editStock);
        openEntityModal("Edit Blood Stock", stockFields(item), "Update Stock", async (data) => { await api(`/blood-stock/${item._id}`, { method: "PUT", body: JSON.stringify(normalizeNumbers(data)) }); showToast("Stock updated"); await loadData(); });
      }
      if (target.dataset.deleteStock && confirm("Delete this stock entry?")) { await api(`/blood-stock/${target.dataset.deleteStock}`, { method: "DELETE" }); showToast("Stock deleted"); await loadData(); }
      if (target.dataset.editRequest) {
        const item = requests.find((row) => row._id === target.dataset.editRequest);
        openEntityModal("Edit Request", requestFields(item), "Update Request", async (data) => { data.price = Number(data.units) * 2400; await api(`/requests/${item._id}`, { method: "PUT", body: JSON.stringify(normalizeNumbers(data)) }); showToast("Request updated"); await loadData(); });
      }
      if (target.dataset.statusRequest) {
        const item = requests.find((row) => row._id === target.dataset.statusRequest);
        const actionPath = target.dataset.status === "Accepted" ? "approve" : "reject";
        await api(`/requests/${item._id}/${actionPath}`, { method: "PATCH" });
        showToast(`Request ${target.dataset.status.toLowerCase()}`);
        await loadData();
      }
      if (target.dataset.deleteRequest && confirm("Delete this request?")) { await api(`/requests/${target.dataset.deleteRequest}`, { method: "DELETE" }); showToast("Request deleted"); await loadData(); }
      if (target.dataset.editUser) {
        const user = users.find((row) => row._id === target.dataset.editUser);
        openEntityModal("Edit User", userFields(user), "Update User", async (data) => {
          if (!data.password) delete data.password;
          await api(`/users/${user._id}`, { method: "PUT", body: JSON.stringify(data) });
          showToast("User updated");
          await loadData();
        });
      }
      if (target.dataset.deleteUser && confirm("Delete this user?")) { await api(`/users/${target.dataset.deleteUser}`, { method: "DELETE" }); showToast("User deleted"); await loadData(); }
      if (target.dataset.facility) {
        selectedFacility = buildStateClusters()[Number(target.dataset.facility)] || INDIA_LOCATIONS[Number(target.dataset.facility)] || INDIA_LOCATIONS[0];
        renderNetwork();
        fitIndia();
      }
      if (target.dataset.city) {
        selectCity(target.dataset.city);
      }
      if (target.dataset.level) {
        setZoomLevel(target.dataset.level);
        document.getElementById("networkTitle").textContent = `${target.textContent} View`;
        document.getElementById("networkSummary").textContent = `${target.textContent} zoom shows Indian blood banks, hospitals, donor clusters, and live contact detail layers.`;
      }
      if (target.dataset.mapReset) fitIndia();
      if (target.dataset.addCart) {
        addToCart(target.dataset.addCart);
      }
      if (target.dataset.viewProduct) {
        openProductView(target.dataset.viewProduct);
      }
      if (target.dataset.compatGroup) {
        selectedCompatGroup = target.dataset.compatGroup;
        renderCompatibility();
      }
      if (target.dataset.trackOrder) {
        setView("tracking");
        renderTracking();
      }
      if (target.dataset.removeCart) {
        removeCartItem(target.dataset.removeCart);
      }
      if (target.dataset.cartDelta) {
        const item = marketplaceCart.find((row) => row.id === target.dataset.cartId);
        updateCartQuantity(target.dataset.cartId, Number(item?.quantity || 1) + Number(target.dataset.cartDelta));
      }
      if (target.dataset.openMarketplace) {
        setView("marketplace");
      }
      if (target.dataset.requestMarket) {
        const bloodGroup = target.dataset.requestMarket;
        const hospital = target.dataset.hospital;
        openEntityModal("Request Blood Allocation", [
          { label: "Patient", name: "patient", value: "Emergency Patient" },
          { label: "Blood Group", name: "bloodGroup", type: "select", value: bloodGroup, options: BLOOD_GROUPS },
          { label: "Units", name: "units", type: "number", value: 1 },
          { label: "Hospital", name: "hospital", value: hospital },
          { label: "State", name: "state", value: "Delhi" },
          { label: "Emergency Request", name: "isEmergency", type: "select", value: "true", options: ["false", "true"] },
          { label: "Status", name: "status", type: "select", value: "Pending", options: STATUS_OPTIONS }
        ], "Submit Request", async (data) => {
          data.price = Number(data.units) * 2400;
          await api("/requests", { method: "POST", body: JSON.stringify(normalizeNumbers(data)) });
          showToast("Blood request submitted for allocation");
          await loadData();
          renderRequestTracking();
        });
      }
      if (target.dataset.viewHospital) {
        const hospitalId = target.dataset.viewHospital;
        const hospital = hospitals.find((h) => h._id === hospitalId);
        if (hospital) {
          showHospitalProfile(hospitalId);
        } else {
          showToast("Hospital details not available");
        }
      }
    } catch (error) { showToast(error.message); }
  });

  ["stockFilter", "stockStatusFilter"].forEach((id) => document.getElementById(id).addEventListener("input", renderStockTable));
  ["donorFilter", "donorGroupFilter"].forEach((id) => document.getElementById(id).addEventListener("input", renderDonors));
  ["hospitalFilter", "hospitalStatusFilter"].forEach((id) => document.getElementById(id).addEventListener("input", renderHospitals));
  ["requestFilter", "requestStatusFilter"].forEach((id) => document.getElementById(id).addEventListener("input", renderRequests));
  ["userFilter", "userRoleFilter"].forEach((id) => document.getElementById(id).addEventListener("input", renderUsers));
  document.getElementById("globalSearch").addEventListener("input", (event) => { if (event.target.value.length > 1) searchNetwork(event.target.value); });
  document.getElementById("networkSearch").addEventListener("input", (event) => searchNetwork(event.target.value));
  ["findNearbyBtn", "findNearbyHero", "floatingFinder"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.addEventListener("click", findNearbyBloodBanks);
  });
  document.getElementById("useLocationBtn").addEventListener("click", () => {
    requestMapLocation(true).catch(() => {});
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.getElementById("globalSearch")?.focus();
    }
  });
  document.getElementById("routeBtn").addEventListener("click", drawRoute);
  document.getElementById("notificationBell").addEventListener("click", () => setView("notifications"));
  document.getElementById("clearNotifications").addEventListener("click", () => { notifications = []; renderNotifications(); renderStats(); showToast("Notifications marked read"); });
  document.getElementById("refreshAnalytics").addEventListener("click", async () => {
    try {
      analyticsData = await api("/analytics");
      renderAnalytics();
      showToast("Analytics refreshed");
    } catch (error) {
      showToast(error.message);
    }
  });
  document.getElementById("saveSettings").addEventListener("click", async () => {
    const threshold = Number(document.getElementById("thresholdSetting").value || 60);
    await Promise.all(stock.map((item) => api(`/blood-stock/${item._id}`, { method: "PUT", body: JSON.stringify({ ...item, lowStockThreshold: threshold }) })));
    showToast("Settings saved");
    await loadData();
  });

  // Marketplace event listeners
  document.getElementById("createMarketRequestBtn").addEventListener("click", () => {
    openEntityModal("Create Blood Request", requestFields(), "Submit Request", async (data) => {
      data.price = Number(data.units) * 2400;
      await api("/requests", { method: "POST", body: JSON.stringify(normalizeNumbers(data)) });
      showToast("Blood request submitted for allocation");
      await loadData();
      renderRequestTracking();
    });
  });
  document.getElementById("closeTrackingPanel").addEventListener("click", () => {
    document.getElementById("requestTrackingPanel").style.display = "none";
  });
  ["marketSearch", "marketBloodFilter", "marketCityFilter", "marketHospitalFilter", "marketAvailabilityFilter", "marketEmergencyFilter"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderMarketplace);
  });
  document.getElementById("clearCartBtn").addEventListener("click", () => {
    marketplaceCart = [];
    saveCart();
    renderCheckout();
    showToast("Cart cleared");
  });
  document.getElementById("goCheckoutBtn").addEventListener("click", () => {
    if (!marketplaceCart.length) {
      showToast("Add inventory to cart first");
      setView("marketplace");
      return;
    }
    renderCheckout();
    setView("checkout");
  });
  document.getElementById("checkoutForm").addEventListener("input", renderCheckout);
  document.getElementById("checkoutForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const validation = checkoutCompatibility(data.patientBloodGroup);
    if (!validation.ok) {
      renderCheckout();
      showToast(validation.message);
      return;
    }
    checkoutDraft = data;
    renderPayment();
    setView("payment");
  });
  document.body.addEventListener("input", (event) => {
    if (event.target.dataset.cartQuantity) updateCartQuantity(event.target.dataset.cartQuantity, event.target.value);
  });
  document.querySelectorAll("[data-payment-method]").forEach((button) => button.addEventListener("click", () => {
    selectedPaymentMethod = button.dataset.paymentMethod;
    document.querySelectorAll("[data-payment-method]").forEach((node) => node.classList.toggle("active", node === button));
    renderPayment();
  }));
  document.getElementById("payNowBtn").addEventListener("click", () => processPayment(false));
  document.getElementById("simulateFailureBtn").addEventListener("click", () => processPayment(true));
  document.getElementById("advanceOrderBtn").addEventListener("click", advanceOrderStatus);
  window.addEventListener("resize", () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeMap();
      resizeCharts();
      resizeLiveNetwork();
      drawStatSparklines();
      resizeRaf = null;
    });
  });
}

function populateFilters() {
  const donorGroupFilter = document.getElementById("donorGroupFilter");
  donorGroupFilter.innerHTML = `<option value="">All groups</option>${BLOOD_GROUPS.map((group) => `<option>${group}</option>`).join("")}`;

  // Populate marketplace filters
  const marketCityFilter = document.getElementById("marketCityFilter");
  const marketHospitalFilter = document.getElementById("marketHospitalFilter");

  const cities = [...new Set([...hospitals.map((h) => h.city).filter(Boolean), ...REQUIRED_CITY_NAMES])];
  marketCityFilter.innerHTML = `<option value="">All Cities</option>${cities.map((city) => `<option>${city}</option>`).join("")}`;

  const hospitalNames = [...new Set(marketplaceHospitalPool().map((h) => h.name).filter(Boolean))];
  marketHospitalFilter.innerHTML = `<option value="">All Hospitals</option>${hospitalNames.map((name) => `<option>${name}</option>`).join("")}`;
  renderCityPicker();
}
async function init() {
  restoreCommerceState();
  populateFilters();
  wireEvents();
  updateAuthUI();
  updateDateTime();
  if (clockTimer) window.clearInterval(clockTimer);
  clockTimer = window.setInterval(updateDateTime, 60000);
  initMap();
  initLiveNetwork();
  resizeLiveNetwork();
  try {
    await loadData();
  } catch (error) {
    showToast(error.message);
  }
}

document.addEventListener("DOMContentLoaded", init);
