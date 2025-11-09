'use client';

import React, { useState, useEffect } from 'react';
import styles from '../styles/pages/adminBlogEditor.module.css';
import adminStyles from '../styles/pages/administrator.module.css';

const AdminChapterEditor = ({ chapter, onUpdate, onClose }) => {
    const [description, setDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (chapter) {
            setDescription(chapter.description || '');
            setIsEditing(false);
        }
    }, [chapter]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

        try {
            const result = await onUpdate(chapter.name, description);

            if (result.success) {
                setMessage('Chapter description saved successfully!');
                setIsEditing(false);
                // Clear message after 3 seconds
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to original values
        setDescription(chapter.description || '');
        setIsEditing(false);
        setMessage('');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setMessage('');
    };

    if (!chapter) {
        return null;
    }

    return (
        <div className={styles.editorContainer}>
            <div className={styles.editorHeader}>
                <div className={styles.titleSection}>
                    <h1 className={styles.blogTitle}>
                        Chapter {chapter.chapter_number}: {chapter.name} {chapter.kanji}
                    </h1>
                    <div className={adminStyles.chapterKanji}>
                        
                    </div>
                </div>

                <div className={styles.actionButtons}>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`${styles.button} ${styles.saveButton}`}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className={`${styles.button} ${styles.cancelButton}`}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleEdit}
                                className={`${styles.button} ${styles.editButton}`}
                            >
                                Edit Description
                            </button>
                            <button
                                onClick={onClose}
                                className={`${styles.button} ${styles.closeButton}`}
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>

            {message && (
                <div className={`${styles.message} ${
                    message.startsWith('Error') ? styles.error : styles.success
                }`}>
                    {message}
                </div>
            )}

            <div className={styles.editorContent}>
                <div className={styles.contentSection}>
                    <label className={styles.contentLabel}>
                        Chapter Description:
                    </label>
                    {isEditing ? (
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter chapter description..."
                            className={styles.contentTextarea}
                            disabled={isSaving}
                            rows={15}
                        />
                    ) : (
                        <div className={styles.contentDisplay}>
                            {description ? (
                                <div 
                                    className={styles.renderedContent}
                                    dangerouslySetInnerHTML={{ 
                                        __html: description.replace(/\n/g, '<br>') 
                                    }}
                                />
                            ) : (
                                <p className={styles.emptyContent}>No description available. Click &quot;Edit Description&quot; to add one.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChapterEditor;