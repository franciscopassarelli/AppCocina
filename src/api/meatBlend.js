const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function produceMeatBlend(apiBase, body) {
  const res = await fetch(`${apiBase}/meat-blend/produce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  let data = null;
  try { data = JSON.parse(text); } catch {}
  if (!res.ok) {
    console.error("produceMeatBlend:", res.status, text);
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data || {};
}
