'use client'
import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Eye, EyeOff, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import styles from '../styles/pages/TransDisplay.module.css';
import poemStyles from '../styles/pages/poemDisplay.module.css';

const UserTranslationsDisplay = ({ pageType, identifier, refreshSignal = 0 }) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTranslations, setShowTranslations] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Show error with auto-dismiss after 5 seconds
  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Fetch translations with retry logic
  const fetchTranslations = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await fetch(`/api/translation/getAllTrans?pageType=${pageType}&identifier=${identifier}`);
      
      if (response.ok) {
        const data = await response.json();
        // console.log(data);
        setTranslations(data.trans || []);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching translations:', err);
      showError('Failed to load translations. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pageType, identifier]);

  // Manual refresh handler with force option
  const handleRefresh = () => {
    if (refreshing) return;
    fetchTranslations();
  };

  // Handle delete translation
  const handleDelete = async (translationId, version) => {
    if (!session || deletingId) return;
    if (!confirm('Are you sure you want to delete this translation?')) return;
    
    try {
      setDeletingId(translationId);
      setError(null);
      
      const response = await fetch('/api/translation/deleteTrans', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          _id: translationId,
          version: version 
        }),
      });
      
      if (response.ok) {
        // Remove deleted translation from the list
        setTranslations(prev => prev.filter(t => t._id !== translationId));
      } else if (response.status === 409) {
        showError('This translation has been modified. Refreshing...');
        fetchTranslations();
      } else if (response.status === 404) {
        showError('Translation no longer exists. Refreshing...');
        fetchTranslations();
      } else {
        const data = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        showError(data.message || 'Failed to delete translation');
      }
    } catch (err) {
      console.error('Error deleting translation:', err);
      showError('Failed to delete translation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (pageType && identifier) {
      fetchTranslations();
    }
  }, [pageType, identifier, refreshSignal, fetchTranslations]);

  // Filter translations for regular users
  const visibleTranslations = isAdmin 
    ? translations 
    : translations.filter(t => !t.isHidden);

  return (
    <div className={styles.userTranslationsSection}>
      <div className={styles.translationsHeader}>
        <button
          type="button"
          className={styles.viewTranslationsButton} 
          onClick={() => setShowTranslations(value => !value)}
          aria-expanded={showTranslations}
        >
          {showTranslations ? 'Hide User Translations' : `Show User Translations (${visibleTranslations.length})`}
        </button>
        <button
          type="button"
          className={`${styles.refreshButton} ${styles.inlineRefreshButton}`}
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh user translations"
          aria-label="Refresh user translations"
        >
          <RefreshCw size={16} className={refreshing ? styles.spinning : ''} />
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert} role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {showTranslations && (
        <div className={styles.inlineTranslationsList}>
          {loading && translations.length === 0 ? (
            <div className={styles.loadingMessage}>Loading translations...</div>
          ) : visibleTranslations.length === 0 ? (
            <div className={styles.emptyMessage}>No user translations yet.</div>
          ) : (
            visibleTranslations.map((translation) => (
              <article
                key={translation._id}
                className={`${poemStyles.translationCard} ${poemStyles.communityTranslationCard} ${translation.isHidden ? poemStyles.communityTranslationHidden : ''}`}
              >
                <div className={`${poemStyles.translationContent} ${poemStyles.communityTranslationContent}`}>
                  <p>{translation.content}</p>
                  {translation.isHidden && isAdmin && <span className={styles.hiddenBadge}>Hidden</span>}
                </div>
                <div className={`${poemStyles.translationMeta} ${poemStyles.communityTranslationMeta}`}>
                  <span className={styles.translationDate}>
                    {formatDistanceToNow(new Date(translation.createdAt), { addSuffix: true })}
                  </span>

                  {(isAdmin || translation.isOwner) && (
                    <div className={poemStyles.communityTranslationActions}>
                      <button
                        type="button"
                        className={`${poemStyles.communityTranslationAction} ${poemStyles.communityTranslationDelete}`}
                        onClick={() => handleDelete(translation._id, translation.version || 0)}
                        disabled={deletingId === translation._id}
                        title="Delete translation"
                        aria-label="Delete translation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className={poemStyles.communityTranslationName}>
                    {translation.userName || 'COMMUNITY TRANSLATION'}
                  </div>
                </div>
              </article>
            ))
          )}
          {refreshing && translations.length > 0 && (
            <div className={styles.refreshingIndicator}>
              <RefreshCw size={16} className={styles.spinning} />
              <span>Refreshing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserTranslationsDisplay;