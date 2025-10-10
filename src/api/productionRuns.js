const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function startRun(body) {
  const res = await fetch(`${API_BASE}/production-runs/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmRun(id, body) {
  const res = await fetch(`${API_BASE}/production-runs/${id}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function exportRuns() {
  window.location.href = `${API_BASE}/production-runs/export`;
}

export async function getRuns() {
  const res = await fetch(`${API_BASE}/production-runs`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
