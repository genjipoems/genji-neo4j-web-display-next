'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/pages/chapterProfile.module.css';

const TRANSLATORS = [
    "washburn",
    "cranston",
    "tyler",
    "seidensticker",
    "waley"
];

const translatorItems = TRANSLATORS.map((name) => ({ key: name, label: name }));

export default function TranslatorDropdown({ value, onChange, placeholder = 'Select translator' }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const currentDisplay = value
        ? translatorItems.find(i => i.key === value)?.label ?? value
        : placeholder;

    const filteredItems = translatorItems.filter(item =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && containerRef.current && !containerRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className={styles.analysisPanel} ref={containerRef}>
            <div className={styles.panelHeader}>
                <input
                    type="text"
                    className={styles.panelHeaderSearch}
                    placeholder={currentDisplay}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isDropdownOpen) setIsDropdownOpen(true);
                    }}
                />
                <div
                    className={`${styles.toggleArrow} ${isDropdownOpen ? styles.arrowExpanded : styles.arrowCollapsed}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    ▼
                </div>
            </div>

            <div className={`${styles.panelContent} ${isDropdownOpen ? styles.expanded : ''}`}>
                <div className={styles.scrollableList}>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <div key={item.key} className={styles.characterItem}>
                                <button
                                    type="button"
                                    className={styles.characterButton}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        textAlign: 'left',
                                        fontWeight: value === item.key ? 600 : 400,
                                    }}
                                    onClick={() => {
                                        onChange(item.key);
                                        setSearchTerm('');
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {item.label}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className={styles.noResults}>No Results Found</div>
                    )}
                </div>
            </div>
        </div>
    );
}