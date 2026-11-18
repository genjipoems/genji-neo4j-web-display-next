'use client'
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../styles/pages/transSubmit.module.css';
import { updateScalarField } from './PoemEditApi.prod';

const TransSubmit = ({
  pageType,
  identifier,
  poemId,                 // poem pnum, needed for translator submissions
  translators = [],       // [{ name, fullName }]
  currentTrans = {},      // poemState.trans, to detect existing translations
  onTranslatorSaved,      // (name, text) => void
  onTranslatorDeleted,
  onTranslatorsChanged,   // () => void, refetch the translator list
  onUserTranslationSubmitted,
}) => {
  const { data: session } = useSession();
  const [translation, setTranslation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('self');            // 'self' | 'existing' | 'new'
  const [translatorName, setTranslatorName] = useState('');
  const [newName, setNewName] = useState('');
  const [newFullName, setNewFullName] = useState('');

  const isAdmin = session?.user?.role === 'admin';
  const canPickTranslator = isAdmin && pageType === 'poem' && !!poemId;

  const textOf = (name) => {
    const v = currentTrans?.[name];
    const s = Array.isArray(v) ? v[0] : v;
    return typeof s === 'string' && s !== 'N/A' ? s : '';
  };
  const hasExisting = mode === 'existing' && !!textOf(translatorName);

  const changeMode = (m) => {
    setMode(m);
    setError(null);
    setTranslation(m === 'existing' && translatorName ? textOf(translatorName) : '');
  };

  const pickTranslator = (name) => {
    setTranslatorName(name);
    setTranslation(textOf(name));     // prefill so nothing is overwritten blindly
    setError(null);
  };

  const submitAsTranslator = async () => {
    let name = translatorName;

    if (mode === 'new') {
      name = newName.trim();
      if (!name) throw new Error('Enter a translator name');
      await updateScalarField(poemId, 'newTranslator', name, { fullName: newFullName.trim() });
      onTranslatorsChanged?.();
      // from here on, a retry should target the translator we just created
      setMode('existing');
      setTranslatorName(name);
    }
    if (!name) throw new Error('Choose a translator');

    await updateScalarField(poemId, 'poemTranslation', translation, { translator: name });
    onTranslatorSaved?.(name, translation);
  };

const handleSubmit = async () => {
  if (!session || submitting) return;
  if (!translation.trim()) {
    window.alert('Please enter a translation.');
    return;
    } try {
      setSubmitting(true);
      setError(null);

      if (mode === 'self') {
        const response = await fetch('/api/translation/addTrans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageType, identifier, content: translation }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to submit translation');
        }
        onUserTranslationSubmitted?.();
        setTranslation('');
      } else {
        await submitAsTranslator();
        if (mode === 'new') { setNewName(''); setNewFullName(''); }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your translation');
      console.error('Error submitting translation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!hasExisting || submitting) return;
    if (!window.confirm(`Delete ${translatorName}'s translation of this poem? Any tags attached to it will be removed too.`)) return;

    try {
      setSubmitting(true);
      setError(null);
      await onTranslatorDeleted?.(translatorName);
      setTranslatorName('')
      setTranslation('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete translation');
    } finally {
      setSubmitting(false);
    }
  };

  const buttonLabel = submitting
    ? 'Submitting...'
    : mode === 'self' ? 'Submit Translation'
    : hasExisting ? 'Replace Translation'
    : 'Save Translation';

  return (
    <div className={styles.userTranslationSection}>
      {session ? (
        <>
          {canPickTranslator && (
            <div className={styles.translatorPicker}>
              <label>
                Submit as{' '}
                <select value={mode} onChange={(e) => changeMode(e.target.value)}>
                  <option value="self">Yourself</option>
                  <option value="existing">Existing translator</option>
                  <option value="new">New translator</option>
                </select>
              </label>

              {mode === 'existing' && (
                <select value={translatorName} onChange={(e) => pickTranslator(e.target.value)}>
                  <option value="">Select translator…</option>
                  {translators.map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name}{textOf(t.name) ? ' (has translation)' : ''}
                    </option>
                  ))}
                </select>
              )}

              {mode === 'new' && (
                <>
                  <input
                    type="text"
                    placeholder="Short name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                  />
                </>
              )}
            </div>
          )}

          <textarea
            className={styles.userTranslationInput}
            placeholder="Write your translation here..."
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          />

          <div className={styles.translationControls}>
            <button
              type="button"
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {buttonLabel}
            </button>

            {hasExisting && (
              <button
                type="button"
                className={`${styles.submitButton} ${styles.deleteButton}`}
                onClick={handleDelete}
                disabled={submitting}
              >
                Delete Translation
              </button>
            )}
              {success && (
              <div className={styles.successMessage}>
                {mode === 'self' ? 'Translation submitted successfully!' : 'Translation saved!'}
              </div>
            )}
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        </>
      ) : (
        <div className={styles.loginPrompt}>
          <a href="/api/auth/signin" className={styles.loginLink}>Login to submit translation</a>
        </div>
      )}
    </div>
  );
};

export default TransSubmit;