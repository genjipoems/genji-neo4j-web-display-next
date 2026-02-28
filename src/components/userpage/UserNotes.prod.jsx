'use client'
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from "next-auth/react";
import styles from '../../styles/pages/userNotes.module.css';

const UserNotes = () => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
    const fetchUserData = async () => {
        try {
        const userInCache = localStorage.getItem('userData');
        if (userInCache) {
            const userData = JSON.parse(userInCache);
            setUser(userData);
            setLoading(false)
            return;
        }

        const response = await fetch('api/user/me');
        if(!response.ok) {
            throw new Error('failed to fetch user info');
        }
        const data = await response.json();

        localStorage.setItem('userData', JSON.stringify(data));
        setUser(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    fetchUserData();
    }, [])


// func to refresh user info
const refreshData = async () => {
    setLoading(true);
    try {
        const response = await fetch('api/user/me');
        if(!response.ok) {
            throw new Error('failed to fetch user info');
        }
        const data = await response.json();
        localStorage.setItem('userData', JSON.stringify(data));
        setUser(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
    }
}






  // poem selection
  const [poemQuery, setPoemQuery] = useState('');
  const [poemResults, setPoemResults] = useState([]); // [{id, title, pnum}]
  const [selectedPoem, setSelectedPoem] = useState(null); // {id, title, pnum}

  // editor
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // existing notes list
  const [notes, setNotes] = useState([]); 
  // example: [{ noteId, poemId, poemTitle, updatedAt, title, body }]

  // --- placeholder: fetch user notes ---
  useEffect(() => {
    // You’ll replace this with GET /api/notes/me, etc.
    const fetchNotes = async () => {
      try {
        // const res = await fetch('/api/notes/me');
        // const data = await res.json();
        // setNotes(data);

        setNotes([]); // placeholder
      } catch (e) {
        setError(e.message);
      }
    };

    fetchNotes();
  }, []);

  // --- placeholder: poem search ---
  useEffect(() => {
    let ignore = false;

    const run = async () => {
      if (!poemQuery.trim()) {
        setPoemResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/search/poem_suggest?q=${encodeURIComponent(poemQuery)}`);
        const data = await res.json();
        if (!ignore) setPoemResults(Array.isArray(data.suggestions) ? data.suggestions : []);

      } catch (e) {
        if (!ignore) setError(e.message);
      }
    };

    const t = setTimeout(run, 250); // basic debounce
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [poemQuery]);

  const canSave = useMemo(() => {
    return Boolean(selectedPoem && (noteTitle.trim() || noteBody.trim())) && !saving;
  }, [selectedPoem, noteTitle, noteBody, saving]);

  // --- placeholder: save note ---
  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setSaveMsg('');
    try {
      // Replace with POST/PUT:
      // await fetch('/api/notes', { method:'POST', body: JSON.stringify({ poemId: selectedPoem.id, title: noteTitle, body: noteBody }) })
      setSaveMsg('Saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 1500);
    }
  };

  const loadNoteIntoEditor = (n) => {
    setSelectedPoem({ id: n.poemId, title: n.poemTitle, pnum: n.pnum });
    setNoteTitle(n.title || '');
    setNoteBody(n.body || '');
    setSaveMsg('');
  };

  const clearEditor = () => {
    setSelectedPoem(null);
    setPoemQuery('');
    setPoemResults([]);
    setNoteTitle('');
    setNoteBody('');
    setSaveMsg('');
  };




  if (loading) return <div>Loading user notes...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;


return (
  <div className={styles.page}>
    <main className={styles.grid}>
      {/* LEFT: Editor */}
      <aside className={styles.card}>
        <div className={styles.whiteBox}>
          <div className={styles.cardHeader}>
          <h1 className={styles.title}>Write a Note</h1>

          <div className={styles.poemRow}>
    <input
      className={styles.input}
      value={poemQuery}
      onChange={(e) => {
        const v = e.target.value;
        setPoemQuery(v);

        const found = poemResults.find(p => String(p.pnum) === v);
        setSelectedPoem(found || null);
      }}
      placeholder="Type poem pnum…"
      list="poem-pnum-suggestions"
      aria-label="Search poems by pnum"
    />

    <button
      type="button"
      onClick={clearEditor}
      className={styles.button}
    >
      Clear
    </button>
  </div>

        </div>

        {/* Poem picker (typeahead) */}
        <div className={styles.noteBody}>

          <div className={styles.poemPicker}>

            <datalist id="poem-pnum-suggestions">
              {Array.isArray(poemResults) &&
                poemResults.map((p) => (
                  <option key={p.id ?? p.pnum} value={String(p.pnum)}>
                    {p.pnum ? `${p.pnum}` : ''}
                  </option>
                ))}
            </datalist>
          </div>

          {selectedPoem && (
            <div className={styles.selectedPoemRow}>
              <span className={styles.selectedPoem}>
                Selected: {selectedPoem.pnum ? `${selectedPoem.pnum}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Note body */}
        <div className={styles.noteBody}>
          <textarea
            className={styles.textarea}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Write your note here…"
            rows={10}
          />
          <div className={styles.helpRow}>
            <span className={styles.helpText}>
              {saveMsg ? saveMsg : saving ? 'Saving…' : ''}
            </span>
          </div>
        </div>

        {/* Save */}
        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={styles.button}
          >
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </div>
        </div>
      </aside>

      {/* RIGHT: Notes list */}
      <aside className={styles.card}>
        <div className={styles.whiteBox}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Saved Notes</h1>
          </div>

          {notes.length === 0 ? (
            <p className={styles.muted}>
              No notes yet. Search a poem on the left and start writing.
            </p>
          ) : (
            <ul className={styles.noteList}>
              {notes.map((n) => (
                <li key={n.noteId} className={styles.noteListItem}>
                  <div className={styles.noteMeta}>
                    <div className={styles.notePoemTitle}>{n.poemTitle}</div>
                    <div className={styles.noteUpdatedAt}>
                      {n.updatedAt ? new Date(n.updatedAt).toLocaleString() : ''}
                    </div>
                  </div>

                  <div className={styles.notePreviewTitle}>
                    {n.title || '(Untitled)'}
                  </div>

                  <div className={styles.notePreviewBody}>{n.body}</div>

                  <div className={styles.noteButtons}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => loadNoteIntoEditor(n)}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => {
                        // Replace with DELETE call
                        // await fetch(`/api/notes/${n.noteId}`, { method: 'DELETE' })
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </main>
  </div>
);
}

export default UserNotes