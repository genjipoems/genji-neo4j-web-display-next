'use client'
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import styles from "../../styles/pages/blogTemplate.module.css"

const UserGuidePage = () => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            const res = await fetch('/USER_GUIDE.md');
            const text = await res.text();
            setContent(text);
            setIsLoading(false);
        };

        fetchContent();
    }, []);

    return (
        <div className={styles.translatorPage}>
            <div className={styles.heroSection}>
                <img
                    className={styles.fullBackgroundImage}
                    src={`/images/user_guide.png`}
                    alt="user guide banner"
                />
            </div>

            <div className={styles.mainSection}>
                <div className={styles.description}>
                    <div className={styles.descriptionContent}>
                        {isLoading ? (
                            <div className={styles.loading}>Loading...</div>
                        ) : (
                            <div className={styles.descriptionText}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeSlug]}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserGuidePage;
