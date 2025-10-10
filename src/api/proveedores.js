const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function listarLotesProveedor(estado = 'open') {
  const res = await fetch(`${API_BASE}/proveedores/lotes?estado=${encodeURIComponent(estado)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function crearLoteProveedor(body) {
  const res = await fetch(`${API_BASE}/proveedores/lotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function asignarDesdeProveedor(loteId, body) {
  const res = await fetch(`${API_BASE}/proveedores/lotes/${loteId}/asignar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
