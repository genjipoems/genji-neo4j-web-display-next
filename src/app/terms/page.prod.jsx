'use client'
import React, { useState, useEffect } from 'react';
import FormatContent from "../../components/FormatText.prod"
import styles from "../../styles/pages/blogTemplate.module.css"

const BlogPage = () => {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            const res = await fetch(`/api/blog/getSingle?title=Terms of Service`);
            const data = await res.json();
            setContent(data.content);
            setIsLoading(false);
        };

        fetchContent();
    }, []);

    return (
        <div className={styles.translatorPage}>
            <div className={styles.heroSection}>
                <img
                    className={styles.fullBackgroundImage}
                    src={`/images/privacy_terms.jpg`}
                    alt="terms banner"
                />
                <div className={styles.titleOverlay}>
                    <span className={styles.nameEnglish}>TERMS OF SERVICE</span>
                </div>
            </div>

            <div className={styles.mainSection}>
                <div className={styles.analysisContainer}>
                    {/* Left Side - Panels with Toggles */}
                    <div className={styles.analysisLeft}>
                        
                        {/* Blogs Panel */}
                        <div className={styles.analysisPanel}>
                            
                        </div>

                        {/* Discusssion Panel */}
                        <div className={styles.analysisPanel}>
                            
                        </div>

                        {/* Other Panel */}
                        <div className={styles.analysisPanel}>
                            
                        </div>
                    </div>
                </div>

                <div className={styles.description}>
                    <div className={styles.descriptionContent}>
                        {isLoading ? (
                            <div className={styles.loading}>Loading...</div>
                        ) : (
                            <>  
                                <FormatContent content={content} className={styles.descriptionText} />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BlogPage;
