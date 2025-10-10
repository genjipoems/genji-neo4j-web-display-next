'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import FormatContent from '../../../components/FormatText.prod';
import styles from '../../../styles/pages/blogTemplate.module.css';
import DiscussionArea from '../../../components/DiscussionArea.prod';

const BlogPostPage = () => {
  const { title } = useParams();
  const selectedBlog = decodeURIComponent(title || '');

  const [blogNames, setBlogNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState('');
  const [authorInfo, setAuthorInfo] = useState({ name: '', homepage: '', email: '' });
  const [expandedPanels, setExpandedPanels] = useState({ blogs: false, discussion: false });
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const togglePanel = (p) => setExpandedPanels(prev => ({ ...prev, [p]: !prev[p] }));

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/blog/getBlogListForPage');
      const data = await res.json();
      setBlogNames(data.titles || []);
    })();
  }, []);

  useEffect(() => {
    if (!selectedBlog) return;
    (async () => {
      setIsLoading(true);
      try {
        const blogRes = await fetch(`/api/blog/getSingle?title=${encodeURIComponent(selectedBlog)}`);
        const blogData = await blogRes.json();
        setContent(blogData.content);

        if (blogData.isUser && blogData.authorEmail) {
          const authorRes = await fetch(`/api/user/getByEmail?email=${encodeURIComponent(blogData.authorEmail)}`);
          const authorData = await authorRes.json();
          setAuthorInfo(
            authorData._id && authorData.name
              ? { name: authorData.name, homepage: `/user-home-page/${authorData._id}`, email: blogData.authorEmail }
              : { name: '', homepage: '', email: '' }
          );
        } else {
          setAuthorInfo({ name: '', homepage: '', email: '' });
        }
      } catch (e) {
        console.error(e);
        setAuthorInfo({ name: '', homepage: '', email: '' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectedBlog]);

  const filtered = blogNames.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={styles.translatorPage}>
      <div className={styles.heroSection}>
        <img className={styles.fullBackgroundImage} src="/images/blog_banner.png" alt="blog banner" />
        <div className={styles.blogTitleOverlay}>
          <span className={styles.blogTitle}>{selectedBlog}</span>
        </div>
      </div>

      <div className={styles.mainSection}>
        <div className={styles.analysisContainer}>
          <div className={styles.analysisLeft}>
            <div className={styles.analysisPanel}>
              <div className={styles.panelHeader}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.panelHeaderSearch}
                  placeholder="Blogs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div
                  className={`${styles.toggleArrow} ${expandedPanels.blogs ? styles.arrowExpanded : styles.arrowCollapsed}`}
                  onClick={() => togglePanel('blogs')}
                >
                  ▼
                </div>
              </div>
              <div className={`${styles.panelContent} ${expandedPanels.blogs ? styles.expanded : styles.collapsed}`}>
                {filtered.map((name, i) => {
                  const isSelected = name === selectedBlog;
                  return (
                    <Link
                      key={i}
                      href={`/blog/${encodeURIComponent(name)}`}
                      className={`${styles.blogItem} ${isSelected ? styles.selected : ''}`}
                    >
                      <span className={styles.blogLink}>{name}</span>
                    </Link>
                  );
                })}
                {filtered.length === 0 && searchTerm && <div className={styles.noResults}>No blogs found</div>}
              </div>
            </div>

            <div className={styles.analysisPanel}>
              <div className={styles.panelHeader} onClick={() => togglePanel('discusssion')}>
                <h2>DISCUSSION</h2>
                <div className={`${styles.toggleArrow} ${expandedPanels.discusssion ? styles.arrowExpanded : styles.arrowCollapsed}`}>▼</div>
              </div>
              <div className={`${styles.panelContent} ${expandedPanels.discusssion ? styles.expanded : styles.collapsed}`}>
                <DiscussionArea pageType="blog" identifier={`${selectedBlog}`} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.description}>
          <div className={styles.descriptionContent}>
            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : (
              <>
                <div className={styles.heading}>{selectedBlog}</div>
                <FormatContent content={content} className={styles.descriptionText} />
                {authorInfo.name && authorInfo.homepage ? (
                  <a href={authorInfo.homepage} className={styles.author}>{authorInfo.name}</a>
                ) : authorInfo.email ? (
                  <div className={styles.author}>Author: {authorInfo.email}</div>
                ) : (
                  selectedBlog && <div className={styles.author}>Author information not available</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
