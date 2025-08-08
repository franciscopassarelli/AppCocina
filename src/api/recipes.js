export async function getRecipes(API_BASE) {
  const res = await fetch(`${API_BASE}/recipes`);
  if (!res.ok) throw new Error('Error fetching recipes');
  return res.json();
}

export async function createRecipe(API_BASE, body) {
  const res = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateRecipe(API_BASE, id, body) {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteRecipe(API_BASE, id) {
  const res = await fetch(`${API_BASE}/recipes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

