import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Edit, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import styles from '../styles/pages/notesArea.module.css';
import FormatContent from './FormatText.prod'
import Pagination from './Pagination.prod';

// integrate all note actions into one component
const NoteItem = ({ 
  note, 
  session, 
  onUpdate, 
  onDelete, 
  onCancelEdit, 
  editingNote, 
  setEditingNote,
}) => {
  const isEditing = editingNote === note._id;
  const [localEditContent, setLocalEditContent] = useState(note.content);
  
  // user version to handle version conflict (concurrent editing)
  const noteVersion = note.version || 0;

  useEffect(() => {
    if (isEditing) {
      setLocalEditContent(note.content);
    }
  }, [isEditing, note.content]);

  return (
    <div className={styles.noteThread}>
        <div className={styles.userAvatar}>
          {note.userImage ? (
            <img src={note.userImage} alt={note.userName} className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarFallback}>
              {note.userName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className={styles.noteContent}>
          <div className={styles.noteHeader}>
            <span className={styles.userName}>{note.userName}</span>
            <span className={styles.timestamp}>
              {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
            </span>
          
          </div>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={localEditContent}
                onChange={(e) => setLocalEditContent(e.target.value)}
                className={styles.editInput}
              />
              <div className={styles.editActions}>
                <button
                  onClick={() => onUpdate(note._id, localEditContent, noteVersion)}
                  className={styles.saveButton}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingNote(null);
                    onCancelEdit();
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <FormatContent content={note.content} className={styles.noteText} />
          )}

          <div className={styles.actionButtons}>

            {!isEditing && (
              <button
                onClick={() => {
                  setEditingNote(note._id);
                  setLocalEditContent(note.content);
                }}
                className={`${styles.actionButton} ${styles.editButton}`}
              >
                <Edit size={16} />
                Edit
              </button>
            )}
            
            {
              <button
                onClick={() => onDelete(note._id, noteVersion)}
                className={`${styles.actionButton} ${styles.deleteButton}`}
              >
                <Trash2 size={16} />
                Delete
              </button>
            }
          </div>
        </div>
    </div>
  );
};

const NotesArea = ({ pageType, identifier }) => {
  const { data: session } = useSession();
  const [rawNotes, setRawNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;


  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const fetchNotes = async (pageNum = 1) => {
    try {
      setRefreshing(true);

      const page = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;

      const response = await fetch(
        `/api/notesArea/getAllNotes?pageType=${pageType}&identifier=${identifier}&page=${page}&limit=${pageSize}`
      );

      const data = await response.json();
      console.log('notes data', data);
      setRawNotes(data.notes || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
  
    } catch (error) {
      console.error('Error fetching notes:', error);
      showError('Failed to load notes. Please try again.');

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // handle go to next or previous page
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage || refreshing) {
      return;
    }
    
    setCurrentPage(newPage);
    fetchNotes(newPage);
  };

  // handle refresh
  const handleRefresh = () => {
    fetchNotes(1);
  };

  useEffect(() => {
    if (session) {
      fetchNotes(currentPage);
    }
  }, [session, pageType, identifier, currentPage, pageSize]);
  
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const response = await fetch('/api/notesArea/addNote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageType,
          identifier,
          content: newNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewNote('');
        handleRefresh();
      } else {
        showError(data.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showError('Failed to add note. Please try again.');
    }
  };


  const handleUpdateNote = async (noteId, content, version) => {
    try {
      const response = await fetch('/api/notesArea/updateNote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: noteId,
          content: content,
          version: version 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingNote(null);
        handleRefresh();
      } else {
        showError(data.message || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      showError('Failed to update note. Please try again.');
    }
  };

  const handleDelete = async (noteId, version) => {
    if (!confirm('Are you sure to delete this note?')) return;

    try {
      const response = await fetch('/api/notesArea/deleteNote', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _id: noteId,
          version: version
        }),
      });

      const data = await response.json();

      if (response.ok) {
        handleRefresh();
      } else if (response.status === 404) {
        showError('Note has already been deleted. Refreshing...');
        handleRefresh();
      } else {
        showError(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      showError('Failed to delete note. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">loading notes...</div>;
  }

  return (
    <div className={styles.container}>
      
      {error && (
        <div className={styles.errorNotification}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.notesHeader}>
        <h3 className={styles.notesTitle}></h3>
        {session && <button 
            onClick={handleRefresh} 
            className={styles.refreshButton}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={`${refreshing ? styles.spinning : ''}`} />
          </button>
        }
      </div>

      <div className={styles.inputSection}>
        {session ? (
          <div className={styles.inputWrapper}>
            <div className={styles.userAvatar}>
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name} className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarFallback}>
                  {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className={styles.inputContainer}>
              <textarea
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Post your note..."
                className={styles.noteInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNote();
                  }
                }}
              />
              <button
                onClick={handleAddNote}
                className={styles.sendButton}
                disabled={!newNote.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.loginPrompt}>
            <a href="/api/auth/signin" className={styles.loginLink}>
              Login to note
            </a>
          </div>
        )}
      </div>

      {session && <div className={styles.notesList}>
        {rawNotes?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            no notes yet, write your first note!
          </div>
        ) : (
          rawNotes?.map(note => (
            <NoteItem 
              key={note._id} 
              note={note}
              session={session}
              onUpdate={handleUpdateNote}
              onDelete={handleDelete}
              onCancelEdit={() => setEditingNote(null)}
              editingNote={editingNote}
              setEditingNote={setEditingNote}
            />
          ))
        )}

      {rawNotes?.length > 0 &&  (
          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={refreshing}
          />
      )}

      </div>}
    </div>
  );
};

export default NotesArea;