export async function startRun(API_BASE, body) {
  const res = await fetch(`${API_BASE}/production-runs/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmRun(API_BASE, id, body) {
  const res = await fetch(`${API_BASE}/production-runs/${id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function exportRuns(API_BASE) {
  window.location.href = `${API_BASE}/production-runs/export`;
}

export async function getRuns(API_BASE) {
  const res = await fetch(`${API_BASE}/production-runs`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
