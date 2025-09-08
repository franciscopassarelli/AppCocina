const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function getDepartamentos() {
  const r = await fetch(`${API_BASE}/departamentos`);
  if (!r.ok) throw new Error("Error al cargar departamentos");
  return r.json();
}

export async function createDepartamento(displayName) {
  const r = await fetch(`${API_BASE}/departamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Error al crear departamento");
  return r.json();
}

export async function updateDepartamento(id, displayName) {
  const r = await fetch(`${API_BASE}/departamentos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName }),
  });
  if (!r.ok) throw new Error((await r.json()).error || "Error al renombrar departamento");
  return r.json();
}

export async function deleteDepartamento(id) {
  const r = await fetch(`${API_BASE}/departamentos/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error((await r.json()).error || "Error al borrar departamento");
  return r.json();
}
