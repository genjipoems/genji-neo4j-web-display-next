'use client';

import React, { useState, useEffect } from 'react';
import styles from '../styles/pages/adminBlogEditor.module.css';
import adminStyles from '../styles/pages/administrator.module.css';
import Tiptap from './Tiptap.prod';

const AdminCharacterEditor = ({ character, onUpdate, onClose }) => {
    const [description, setDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (character) {
            setDescription(character.description || '');
            setIsEditing(false);
        }
    }, [character]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');

        try {
            const result = await onUpdate(character.name, description);

            if (result.success) {
                setMessage('Character description saved successfully!');
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
        setDescription(character.description || '');
        setIsEditing(false);
        setMessage('');
    };

    const handleEdit = () => {
        setIsEditing(true);
        setMessage('');
    };

    if (!character) {
        return null;
    }

    return (
        <div className={styles.editorContainer}>
            <div className={styles.editorHeader}>
                <div className={styles.titleSection}>
                    <h1 className={styles.blogTitle}>
                        {character.name}
                    </h1>
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
                        Character Description:
                    </label>
                    {isEditing ? (
                        <Tiptap
                            content={description}
                            onChange={setDescription}
                            editable={true}
                            placeholder="Enter character description..."
                            blogTitle={character.name}
                        />
                    ) : (
                        <div className={styles.contentDisplay}>
                            {description ? (
                                <div
                                    className={styles.renderedContent}
                                    dangerouslySetInnerHTML={{ __html: description }}
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

export default AdminCharacterEditor;