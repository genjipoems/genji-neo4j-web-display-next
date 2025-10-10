'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FormatContent from '../../components/FormatText.prod';
import styles from '../../styles/pages/blogTemplate.module.css';
import DiscussionArea from '../../components/DiscussionArea.prod';

const BlogIndexPage = () => {
  const [blogNames, setBlogNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultBlogContent, setDefaultBlogContent] = useState('');
  const [expandedPanels, setExpandedPanels] = useState({
    blogs: false,
    discussion: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const togglePanel = (panelName) => {
    setExpandedPanels(prev => ({ ...prev, [panelName]: !prev[panelName] }));
  };

  useEffect(() => {
    const fetchBlogNames = async () => {
      const response = await fetch('/api/blog/getBlogListForPage');
      const data = await response.json();
      setBlogNames(data.titles || []);
    };
    fetchBlogNames();
  }, []);

  useEffect(() => {
    const fetchDefaultBlogContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/blog/getSingle?title=Genjipoems Blog`);
        const data = await response.json();
        setDefaultBlogContent(data.content);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDefaultBlogContent();
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredBlogNames = blogNames.filter(blogName =>
    blogName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.translatorPage}>
      <div className={styles.heroSection}>
        <img
          className={styles.fullBackgroundImage}
          src={`/images/blog_banner.png`}
          alt="blog banner"
        />
        <div className={styles.blogTitleOverlay}>
          <span className={styles.blogTitle}>Blog</span>
        </div>
      </div>

      <div className={styles.mainSection}>
        <div className={styles.analysisContainer}>
          {/* Left Side - Panels with Toggles */}
          <div className={styles.analysisLeft}>
            {/* Blogs Panel */}
            <div className={styles.analysisPanel}>
              <div className={styles.panelHeader}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.panelHeaderSearch}
                  placeholder="Blogs"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <div
                  className={`${styles.toggleArrow} ${expandedPanels.blogs ? styles.arrowExpanded : styles.arrowCollapsed}`}
                  onClick={() => togglePanel('blogs')}
                >
                  ▼
                </div>
              </div>

              <div className={`${styles.panelContent} ${expandedPanels.blogs ? styles.expanded : styles.collapsed}`}>
                {filteredBlogNames.map((blogName, index) => (
                  <Link
                    key={index}
                    href={`/blog/${encodeURIComponent(blogName)}`}
                    className={styles.blogItem}
                  >
                    <span className={styles.blogLink}>{blogName}</span>
                  </Link>
                ))}
                {filteredBlogNames.length === 0 && searchTerm && (
                  <div className={styles.noResults}>No blogs found</div>
                )}
              </div>
            </div>

            {/* Discussion Panel (optional on index) */}
            <div className={styles.analysisPanel}>
              <div className={styles.panelHeader} onClick={() => togglePanel('discusssion')}>
                <h2>DISCUSSION</h2>
                <div className={`${styles.toggleArrow} ${expandedPanels.discusssion ? styles.arrowExpanded : styles.arrowCollapsed}`}>
                  ▼
                </div>
              </div>
              <div className={`${styles.panelContent} ${expandedPanels.discusssion ? styles.expanded : styles.collapsed}`}>
                {/* Empty identifier on index; you can point this to a general “Blog” thread if desired */}
                <DiscussionArea pageType="blog" identifier={''} />
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
                <div className={styles.heading}>Genjipoems Blog</div>
                <FormatContent content={defaultBlogContent} className={styles.descriptionText} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogIndexPage;
