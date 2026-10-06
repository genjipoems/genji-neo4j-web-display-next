export async function updateScalarField(pnum, field, value, extraPayload = {}) {
    console.log('DEBUG updateScalarField — extraPayload:', extraPayload);
  const res = await fetch('/api/poems/edit_poem/poem_field_queries', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pnum, field, value, ...extraPayload }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update field');
  }
  return res.json();
}