const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("dabbatiffin_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("dabbatiffin_token", token);
  else localStorage.removeItem("dabbatiffin_token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),

  deliveryPoints: () => request("/delivery-points", { auth: false }),
  updateMe: (payload) => request("/users/me", { method: "PATCH", body: payload }),

  menu: (date, mealType) =>
    request(`/menu?date=${date}${mealType ? `&meal_type=${mealType}` : ""}`),

  home: () => request("/home"),

  createBooking: (payload) => request("/bookings", { method: "POST", body: payload }),
  getBooking: (id) => request(`/bookings/${id}`),

  ordersToday: () => request("/orders/today"),
  ordersForDay: (date) => request(`/orders/day?date=${date}`),
  ordersHistory: () => request("/orders"),
  ordersWeek: () => request("/orders/week"),
  skipOrder: (id) => request(`/orders/${id}/skip`, { method: "POST" }),
  undoSkip: (id) => request(`/orders/${id}/undo-skip`, { method: "POST" }),
  tracking: (id) => request(`/orders/${id}/tracking`),
  reportIssue: (id) => request(`/orders/${id}/report-issue`, { method: "POST" }),

  plans: () => request("/subscriptions/plans", { auth: false }),
  mySubscription: () => request("/subscriptions/me"),
  startSubscription: (payload) => request("/subscriptions", { method: "POST", body: payload }),
  pauseSubscription: (paused) =>
    request("/subscriptions/me", { method: "PATCH", body: { paused } }),
  cancelSubscription: () => request("/subscriptions/me", { method: "DELETE" }),

  wallet: () => request("/wallet"),
};

export { API_URL };
