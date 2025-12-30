'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminBlogEditor from '../../components/AdminBlogEditor.prod';
import AdminChapterEditor from '../../components/AdminChapterEditor.prod';
import AdminCharacterEditor from '../../components/AdminCharacterEditor.prod';
import styles from '../../styles/pages/administrator.module.css';

const AdministratorPage = () => {
    const { session, status, isAuthenticated, isAdmin, isLoading } = useAuth();
    const router = useRouter();
    const [blogs, setBlogs] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [characters, setCharacters] = useState([]);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [editMode, setEditMode] = useState('blogs'); // 'blogs', 'characters', or 'chapters'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isLoading) return; // Wait for auth to load

        // Check if user is authenticated
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if user has admin role
        if (!isAdmin) {
            router.push('/');
            return;
        }

        fetchBlogs();
        fetchChapters();
        fetchCharacters();
    }, [isAuthenticated, isAdmin, isLoading, router,]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/blog/getBlogList');
            if (!response.ok) {
                throw new Error('Failed to fetch blogs');
            }
            const data = await response.json();
            setBlogs(data.titles || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchChapters = async () => {
        try {
            const response = await fetch('/api/chapter_names');
            if (!response.ok) {
                throw new Error('Failed to fetch chapters');
            }
            const data = await response.json();
            setChapters(data || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchCharacters = async () => {
        try {
            const response = await fetch('/api/character_names');
            if (!response.ok) {
                throw new Error('Failed to fetch characters');
            }
            const data = await response.json();
            setCharacters(data || []);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleBlogSelect = async (title) => {
        try {
            const response = await fetch(`/api/blog/getSingle?title=${encodeURIComponent(title)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch blog content');
            }
            const data = await response.json();
            setSelectedBlog({
                title,
                content: data.content,
                showOnPage: data.showOnPage,
                authorEmail: data.authorEmail,
                isUser: data.isUser
            });
            setSelectedChapter(null); // Clear chapter selection
            setSelectedCharacter(null); // Clear character selection
        } catch (err) {
            setError(err.message);
        }
    };

    const handleChapterSelect = async (chapterName) => {
        try {
            const response = await fetch(`/api/chapter_profile?name=${encodeURIComponent(chapterName)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch chapter data');
            }
            const data = await response.json();
            setSelectedChapter({
                name: chapterName,
                description: data.chapter.Description || '',
                chapter_number: data.chapter.chapter_number,
                kanji: data.chapter.kanji
            });
            setSelectedBlog(null); // Clear blog selection
            setSelectedCharacter(null); // Clear character selection
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCharacterSelect = async (characterName) => {
        try {
            const response = await fetch(`/api/character_profile?name=${encodeURIComponent(characterName)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch character data');
            }
            const data = await response.json();
            setSelectedCharacter({
                name: characterName,
                description: data.character?.Description || ''
            });
            setSelectedBlog(null); // Clear blog selection
            setSelectedChapter(null); // Clear chapter selection
        } catch (err) {
            setError(err.message);
        }
    };

    const handleBlogUpdate = async (originalTitle, newTitle, content, showOnPage) => {
        try {
            // Update blog content, title, and showOnPage in one call
            const contentResponse = await fetch('/api/administrator/updateBlog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalTitle, newTitle, content, showOnPage }),
            });

            const responseData = await contentResponse.json();

            if (!contentResponse.ok) {
                // Extract detailed error message from response
                const errorMessage = responseData.error || responseData.message || 'Failed to update blog';
                throw new Error(errorMessage);
            }

            // Refresh the blog list to update sidebar
            await fetchBlogs();

            // Update the selected blog with new title, content and showOnPage
            setSelectedBlog(prev => ({
                ...prev,
                title: newTitle,
                content,
                showOnPage
            }));

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleChapterUpdate = async (chapterName, description) => {
        try {
            const response = await fetch('/api/administrator/updateChapterDescription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chapterName, description }),
            });

            if (!response.ok) {
                throw new Error('Failed to update chapter description');
            }

            // Update the selected chapter description
            setSelectedChapter(prev => ({
                ...prev,
                description
            }));

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleCharacterUpdate = async (characterName, description) => {
        try {
            const response = await fetch('/api/administrator/updateCharacterDescription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ characterName, description }),
            });

            if (!response.ok) {
                throw new Error('Failed to update character description');
            }

            // Update the selected character description
            setSelectedCharacter(prev => ({
                ...prev,
                description
            }));

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleModeChange = (mode) => {
        setEditMode(mode);
        setSelectedBlog(null);
        setSelectedChapter(null);
        setSelectedCharacter(null);
        setError(null);
    };

    const handleCreateBlog = async (title, content, showOnPage) => {
        try {
            const response = await fetch('/api/administrator/createBlog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, showOnPage }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                // Extract detailed error message from response
                const errorMessage = responseData.error || responseData.message || 'Failed to create blog';
                throw new Error(errorMessage);
            }

            // Refresh the blog list
            await fetchBlogs();
            
            // Select the newly created blog
            handleBlogSelect(title);

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const handleDeleteBlog = async (title) => {
        try {
            const response = await fetch(`/api/administrator/deleteBlog?title=${encodeURIComponent(title)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete blog');
            }

            // Refresh the blog list
            await fetchBlogs();
            
            // Clear selected blog if it was the deleted one
            if (selectedBlog?.title === title) {
                setSelectedBlog(null);
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Show loading while auth is being determined
    if (isLoading || loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loader}>Loading...</div>
            </div>
        );
    }

    // Show unauthorized access message for non-admins
    if (isAuthenticated && !isAdmin) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.unauthorizedMessage}>
                    <h2>Access Denied</h2>
                    <p>You do not have administrator privileges to access this page.</p>
                </div>
            </div>
        );
    }

    // Don't render anything if not authenticated (will redirect to login)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles.administratorContainer}>
            <div className={styles.header}>
                <h1 className={styles.title}>Administrator Panel</h1>
                
                {/* Mode Selection */}
                <div className={styles.modeSelector}>
                    <button
                        className={`${styles.modeButton} ${editMode === 'blogs' ? styles.active : ''}`}
                        onClick={() => handleModeChange('blogs')}
                    >
                        Edit Blogs
                    </button>
                    <button
                        className={`${styles.modeButton} ${editMode === 'characters' ? styles.active : ''}`}
                        onClick={() => handleModeChange('characters')}
                    >
                        Edit Characters
                    </button>
                    <button
                        className={`${styles.modeButton} ${editMode === 'chapters' ? styles.active : ''}`}
                        onClick={() => handleModeChange('chapters')}
                    >
                        Edit Chapters
                    </button>
                </div>
            </div>

            <div className={styles.mainContent}>
                {/* Left Sidebar - Blog List, Character List, or Chapter List */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2>
                            {editMode === 'blogs' ? 'Blog Posts' : 
                             editMode === 'characters' ? 'Characters' : 'Chapters'}
                        </h2>
                        {editMode === 'blogs' && (
                            <button 
                                className={styles.createButton}
                                onClick={() => setSelectedBlog({ 
                                    title: '', 
                                    content: '', 
                                    showOnPage: false,
                                    isNew: true 
                                })}
                            >
                                + New Blog
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            Error: {error}
                        </div>
                    )}

                    <div className={styles.blogList}>
                        {editMode === 'blogs' ? (
                            blogs.map((title) => (
                                <div
                                    key={title}
                                    className={`${styles.blogItem} ${
                                        selectedBlog?.title === title ? styles.active : ''
                                    }`}
                                    onClick={() => handleBlogSelect(title)}
                                >
                                    <div className={styles.blogTitle}>{title}</div>
                                </div>
                            ))
                        ) : editMode === 'characters' ? (
                            characters.map((characterName) => (
                                <div
                                    key={characterName}
                                    className={`${styles.blogItem} ${
                                        selectedCharacter?.name === characterName ? styles.active : ''
                                    }`}
                                    onClick={() => handleCharacterSelect(characterName)}
                                >
                                    <div className={styles.blogTitle}>
                                        {characterName}
                                    </div>
                                </div>
                            ))
                        ) : (
                            chapters.map((chapter) => (
                                <div
                                    key={chapter.name}
                                    className={`${styles.blogItem} ${
                                        selectedChapter?.name === chapter.name ? styles.active : ''
                                    }`}
                                    onClick={() => handleChapterSelect(chapter.name)}
                                >
                                    <div className={styles.blogTitle}>
                                        {chapter.number}: {chapter.name} {chapter.kanji}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Content Area - Editor */}
                <div className={styles.editorArea}>
                    {editMode === 'blogs' ? (
                        selectedBlog ? (
                            <AdminBlogEditor
                                blog={selectedBlog}
                                onUpdate={handleBlogUpdate}
                                onCreate={handleCreateBlog}
                                onDelete={handleDeleteBlog}
                                onClose={() => setSelectedBlog(null)}
                            />
                        ) : (
                            <div className={styles.noSelection}>
                                <h3>Select a blog post to edit</h3>
                                <p>Choose a blog from the list on the left, or create a new one.</p>
                            </div>
                        )
                    ) : editMode === 'characters' ? (
                        selectedCharacter ? (
                            <AdminCharacterEditor
                                character={selectedCharacter}
                                onUpdate={handleCharacterUpdate}
                                onClose={() => setSelectedCharacter(null)}
                            />
                        ) : (
                            <div className={styles.noSelection}>
                                <h3>Select a character to edit</h3>
                                <p>Choose a character from the list on the left to edit their description.</p>
                            </div>
                        )
                    ) : (
                        selectedChapter ? (
                            <AdminChapterEditor
                                chapter={selectedChapter}
                                onUpdate={handleChapterUpdate}
                                onClose={() => setSelectedChapter(null)}
                            />
                        ) : (
                            <div className={styles.noSelection}>
                                <h3>Select a chapter to edit</h3>
                                <p>Choose a chapter from the list on the left to edit its description.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdministratorPage;
