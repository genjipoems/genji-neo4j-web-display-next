'use client'
import React, { useState, useEffect } from 'react';
import FormatContent from "../../components/FormatText.prod"
import styles from "../../styles/pages/blogTemplate.module.css"

const BlogPage = () => {
    const [isLoading, setIsLoading] = useState({ left: true, right: true });
    const [completePoemList, setCompletePoemList] = useState([]);
    const [recentUpdatedPoemList, setRecentUpdatedPoemList] = useState([]);

    function relativeTime(dt) {
        const now = new Date();
        const diff = now - dt;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return "just now";
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (days < 30) return `${Math.floor(days/7)} week${Math.floor(days/7) > 1 ? 's' : ''} ago`;
        if (days < 365) return `${Math.floor(days/30)} month${Math.floor(days/30) > 1 ? 's' : ''} ago`;
        return `${Math.floor(days/365)} year${Math.floor(days/365) > 1 ? 's' : ''} ago`;
    }
    
    function FormatTime(dtStr) {
        const dt = new Date(dtStr.split('[')[0]);
        const relative = relativeTime(dt);
        const absolute = dt.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
        
        return {
            display: relative,
            tooltip: absolute
        };
    }


    useEffect(() => {
        const fetchCompletePoemList = async () => {
            const res = await fetch(`/api/recent_updates/get_complete_poem_list`);
            const data = await res.json();
            setCompletePoemList(data);
            setIsLoading(prev => ({ ...prev, left: false }));
        };

        const fetchRecentUpdatedPoemList = async () => {
            const res = await fetch(`/api/recent_updates/get_recent_updated_poem_list`);
            const data = await res.json();
            setRecentUpdatedPoemList(data);
            setIsLoading(prev => ({ ...prev, right: false }));
        };

        fetchCompletePoemList();
        fetchRecentUpdatedPoemList();
    }, []);

    return (
        <div className={styles.translatorPage}>
            <div className={styles.heroSection}>
                <img
                    className={styles.fullBackgroundImage}
                    src={`/images/sources_banner.png`}
                    alt="sources banner"
                />
                {/* <div className={styles.titleOverlay}>
                    <span className={styles.nameEnglish}>ABOUT</span>
                </div> */}
            </div>

            <div className={styles.mainSection}>
                <div className={styles.analysisSources}>
                    {/* Left Side - completed poem list */}
                    <div className={styles.analysisLeft}>
                        <div className={styles.descriptionSources}>
                            <div className={styles.descriptionContentSources}>
                            <h2 className={styles.translationsHeader}>COMPLETED POEM ANNOTATIONS</h2>
                                {isLoading.left ? (
                                    <div className={styles.loading}>Loading...</div>
                                ) : (
                                    <div className={styles.sourcesScrollContainer}>
                                        {completePoemList.map((completePoem, index) => {
                                            const timeInfo = FormatTime(completePoem.last_updated_ny_time);
                                            return (
                                                <div key={index} className={styles.translationCard}>
                                                    <div className={styles.translationContent}>
                                                        <a 
                                                            key={index}
                                                            onClick={() => window.location.href = `/poems/${parseInt(completePoem.pnum.substring(0, 2), 10)}/${parseInt(completePoem.pnum.substring(4, 6), 10)}`}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            {completePoem.pnum}
                                                        </a>
                                                    </div>
                                                    <span className={styles.translatorName} style={{backgroundColor: 'rgba(154, 152, 152, 0.66)'}} title={timeInfo.tooltip}>{timeInfo.display}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div> 
                    </div>
                </div>

                <div className={styles.analysisSources}>
                    {/* Right Side - recent updated poem list */}
                    <div className={styles.analysisLeft}>
                        <div className={styles.descriptionSources}>
                            <div className={styles.descriptionContentSources}>
                            <h2 className={styles.translationsHeader}>RECENTLY UPDATED POEM ANNOTATIONS</h2>
                                {isLoading.right ? (
                                    <div className={styles.loading}>Loading...</div>
                                ) : (
                                    <div className={styles.sourcesScrollContainer}>
                                        {recentUpdatedPoemList.map((recentUpdatedPoem, index) => {
                                            const timeInfo = FormatTime(recentUpdatedPoem.last_updated_ny_time);
                                            return (
                                                <div key={index} className={styles.translationCard}>
                                                    <div className={styles.translationContent}>
                                                        <a 
                                                            key={index}
                                                            onClick={() => window.location.href = `/poems/${parseInt(recentUpdatedPoem.pnum.substring(0, 2), 10)}/${parseInt(recentUpdatedPoem.pnum.substring(4, 6), 10)}`}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            {recentUpdatedPoem.pnum}
                                                        </a>
                                                    </div>
                                                    <span className={styles.translatorName} style={{backgroundColor: 'rgba(154, 152, 152, 0.66)'}} title={timeInfo.tooltip}>{timeInfo.display}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div> 
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BlogPage;
