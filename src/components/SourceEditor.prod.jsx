'use client'
import React, { useState } from 'react';
import { useIsAdmin } from '../hooks/useAuth';

// Self-contained styles so this popup works regardless of which page it's
// dropped into — doesn't depend on editPoemPage.css or any other stylesheet.
const S = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  container: {
    background: '#fff',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  header: { marginBottom: '16px' },
  title: { margin: 0, fontSize: '1.4rem', color: '#222' },
  fieldContainer: { marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#333' },
  input: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', minHeight: '70px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  error: { background: '#fdecea', color: '#b3261e', padding: '10px', borderRadius: '4px', marginBottom: '14px', fontSize: '0.9rem' },
  buttonsRow: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  cancelBtn: { padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer' },
  deleteBtn: { padding: '8px 16px', border: '1px solid #dc3545', borderRadius: '4px', background: '#fff', color: '#dc3545', cursor: 'pointer' },
  saveBtn: { padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#007cba', color: '#fff', cursor: 'pointer', fontWeight: 600 },
  addBtn: { padding: '8px 14px', border: 'none', borderRadius: '4px', background: '#28a745', color: '#fff', cursor: 'pointer', fontWeight: 600, marginBottom: '12px' },
  pencilBtn: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem', marginLeft: '0.4rem' },
};

// Fields that live directly on the :Source node, in display order.
// type: 'text' | 'textarea' | 'checkbox'
const FIELD_CONFIG = [
  { key: 'title', label: 'Title (display text)', type: 'textarea' },
  { key: 'author', label: 'Author', type: 'text' },
  { key: 'reference_title', label: 'Reference Title', type: 'text' },
  { key: 'container_title', label: 'Container Title', type: 'text' },
  { key: 'contributors', label: 'Contributors', type: 'text' },
  { key: 'item_type', label: 'Item Type', type: 'text', list: ['Book', 'Book Chapter', 'Journal Article', 'Website'] },
  { key: 'publisher', label: 'Publisher', type: 'text' },
  { key: 'publication_year', label: 'Publication Year', type: 'text' },
  { key: 'locator', label: 'Locator (pages, etc.)', type: 'text' },
  { key: 'identifier', label: 'Identifier (ISBN, etc.)', type: 'text' },
  { key: 'url', label: 'URL', type: 'text' },
  { key: 'formatted_citation', label: 'Formatted Citation', type: 'textarea' },
  { key: 'on_source_page', label: 'Show on Further Reading page', type: 'checkbox' },
];

const EMPTY_FORM = FIELD_CONFIG.reduce((acc, f) => {
  acc[f.key] = f.type === 'checkbox' ? 'true' : '';
  return acc;
}, {});

async function fetchSource(sourceId) {
  const res = await fetch(`../api/source/edit_source?source_id=${encodeURIComponent(sourceId)}`);
  if (!res.ok) throw new Error('Failed to fetch source data');
  return res.json();
}

async function saveSource(sourceId, data) {
  const isNew = !sourceId;
  const url = isNew
    ? '../api/source/edit_source'
    : `../api/source/edit_source?source_id=${encodeURIComponent(sourceId)}`;

  const res = await fetch(url, {
    method: isNew ? 'POST' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save source');
  }
  return res.json();
}

async function deleteSource(sourceId) {
  const res = await fetch(`../api/source/edit_source?source_id=${encodeURIComponent(sourceId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete source');
  }
  return res.json();
}

function SourcePopup({ sourceId, onClose, onSaved = () => {} }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!!sourceId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (!sourceId) return; // creating new — start blank
    fetchSource(sourceId)
      .then((data) => {
        const next = { ...EMPTY_FORM };
        FIELD_CONFIG.forEach(({ key, type }) => {
          if (type === 'checkbox') {
            next[key] = data[key] === 'false' ? 'false' : 'true';
          } else {
            next[key] = data[key] ?? '';
          }
        });
        setForm(next);
      })
      .catch((e) => {
        console.error('fetchSource failed:', e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [sourceId]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await saveSource(sourceId, form);
      console.log('Source saved:', result);
      onClose();
      try {
        onSaved();
      } catch (callbackError) {
        console.error('onSaved callback threw (save itself succeeded):', callbackError);
      }
    } catch (e) {
      console.error('saveSource failed:', e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!sourceId) return;
    if (!window.confirm('Delete this source permanently?')) return;
    setSaving(true);
    setError(null);
    try {
      const result = await deleteSource(sourceId);
      console.log('Source deleted:', result);
      onClose();
      try {
        onSaved();
      } catch (callbackError) {
        console.error('onSaved callback threw (delete itself succeeded):', callbackError);
      }
    } catch (e) {
      console.error('deleteSource failed:', e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Click on the dark backdrop (but not the card itself) closes the popup
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div style={S.overlay} onClick={handleOverlayClick}>
      <div style={S.container}>
        <div style={S.header}>
          <h2 style={S.title}>{sourceId ? 'Edit Source' : 'Add New Source'}</h2>
        </div>

        {error && <div style={S.error}>⚠️ {error}</div>}

        {loading ? (
          <div>Loading source data...</div>
        ) : (
          <div>
            {FIELD_CONFIG.map(({ key, label, type, list }) => (
              <div key={key} style={S.fieldContainer}>
                <label style={S.label}>{label}</label>
                {type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={form[key] === 'true'}
                    onChange={(e) => updateField(key, e.target.checked ? 'true' : 'false')}
                  />
                ) : type === 'textarea' ? (
                  <textarea
                    style={S.textarea}
                    value={form[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                ) : (
                  <>
                    <input
                      type="text"
                      list={list ? `${key}-options` : undefined}
                      value={form[key]}
                      onChange={(e) => updateField(key, e.target.value)}
                      style={S.input}
                    />
                    {list && (
                      <datalist id={`${key}-options`}>
                        {list.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={S.buttonsRow}>
          {sourceId && (
            <button onClick={handleDelete} disabled={saving} style={S.deleteBtn}>
              Delete
            </button>
          )}
          <button onClick={onClose} disabled={saving} style={S.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || loading} style={S.saveBtn}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small pencil-edit button meant to sit inside an existing source card.
// Usage: <SourceEditButton sourceId={source.source_id} onSaved={refreshSources} />
export function SourceEditButton({ sourceId, onSaved }) {
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  if (!sourceId) {
    // Card has no source_id — almost always means getSources hasn't been
    // patched to return it yet. Log so it's obvious in devtools rather than
    // silently doing nothing.
    console.warn('SourceEditButton rendered without a sourceId — check that ../api/source/getSources returns source_id.');
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Edit source"
        style={S.pencilBtn}
      >
        ✏️
      </button>
      {open && (
        <SourcePopup
          sourceId={sourceId}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}

// "+ Add New Source" button. Drop this above/near the sources list.
// Usage: <AddSourceButton onSaved={refreshSources} />
export function AddSourceButton({ onSaved }) {
  const { isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={S.addBtn}>
        ＋ Add New Source
      </button>
      {open && (
        <SourcePopup
          sourceId={null}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}