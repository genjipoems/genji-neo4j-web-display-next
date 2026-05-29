'use client'
import React, { useState, useEffect } from 'react';
import FormatContent from "../../components/FormatText.prod"
import styles from "../../styles/pages/blogTemplate.module.css"

const BlogPage = () => {
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const memberContent = "Concept: \n&nbsp;J. Keith Vincent \n\nSoftware Development: \n&nbsp;Shen Liu \n&nbsp;Wai-Lun Mak \n&nbsp;Jason Huang \n\nResearch and Writing:\n&nbsp;J. Keith Vincent \n&nbsp;Chris Ellars \n&nbsp;Bergen Grant \n\nWebsite Design:\n&nbsp;Anthony Lee (Honeststruggle.com)\n\nPoem and Metadata Entry:\n&nbsp;Marcus Lee \n&nbsp;Elijah Woo \n\nInterns:\n&nbsp;Alex Luby-Prikot \n&nbsp;Jackson Pine \n&nbsp;Qiyue Hu \n\nPast Team Members:\n&nbsp;Rebekah Machemer \n&nbsp;Marcus Dong \n&nbsp;Brian Teoh \n&nbsp;William Zeng\n&nbsp;Kingson Wu"

    useEffect(() => {
        const fetchContent = async () => {
            const res = await fetch(`/api/blog/getSingle?title=Team Members`);
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
                    src={`/images/team_members_banner.png`}
                    alt="team members banner"
                />
                {/* <div className={styles.titleOverlay}>
                    <span className={styles.nameEnglish}>ABOUT</span>
                </div> */}
            </div>

            <div className={styles.mainSection}>
                <div className={styles.rightSideMembers}>
                    <h2 className={styles.membersHeader}>TEAM MEMBERS</h2>
                    {isLoading ? (
                        <div className={styles.loading}>Loading...</div>
                    ) : (
                        <div className={styles.membersColumns}>
                            <FormatContent content={content} className={styles.descriptionText} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BlogPage;