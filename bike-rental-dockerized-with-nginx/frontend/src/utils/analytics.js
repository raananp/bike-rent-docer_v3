// frontend/src/utils/analytics.js
// Simple, robust tracker using sendBeacon when available.
// Stores a stable sessionId in localStorage to approximate unique visitors.

const KEY = 'sessionId';

function getSessionId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    // RFC4122-ish quick UUID
    id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
    localStorage.setItem(KEY, id);
  }
  return id;
}

function post(url, payload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      // Ensure explicit JSON so the backend’s JSON parser accepts it.
      const blob = new Blob([body], { type: 'application/json;charset=UTF-8' });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    // fall through to fetch
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function trackPageView(pathname = window.location.pathname) {
  post('/api/analytics/track', {
    type: 'page_view',
    sessionId: getSessionId(),
    path: pathname,
    ts: Date.now(),
  });
}

export function trackBikeOpen({ bikeId, bikeName }) {
  post('/api/analytics/track', {
    type: 'bike_open',
    sessionId: getSessionId(),
    bikeId,
    bikeName,
    ts: Date.now(),
  });
}