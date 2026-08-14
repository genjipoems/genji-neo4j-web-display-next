'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/pages/chapterProfile.module.css';

/**
 * Generic multi-select dropdown with search, select-all, and allowed/disallowed
 * sorting+greying. Used by ChapterDropdown, SpeakerDropdown, AddresseeDropdown,
 * LocationDropdown — anything that's "pick some items from a list, constrained
 * by other filters."
 *
 * items: [{ key: string, label: string, sublabel?: string }]
 * value: string[] (selected keys)
 * onChange: (string[]) => void
 * allowedKeys: Set<string> | null   (null = no constraint, everything allowed)
 * placeholder: string
 */

function stripMacrons(str) {
  if (!str) return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function MultiSelectDropdown({
  items,
  value,
  onChange,
  allowedKeys = null,
  placeholder = "Select options",
  sortComparator = (a, b) => a.label.localeCompare(b.label),
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  const currentDisplay = selected.length === 0
    ? placeholder
    : selected.length === 1
    ? items.find(i => i.key === selected[0])?.label ?? selected[0]
    : `${selected.length} selected`;

  const isAllowed = (key) => allowedKeys === null || allowedKeys.has(key);

  const filteredItems = items
    .filter(item =>
      stripMacrons(item.label.toLowerCase()).includes(stripMacrons(searchTerm.toLowerCase())) ||
      stripMacrons(item.key.toLowerCase()).includes(stripMacrons(searchTerm.toLowerCase()))
    )
    // allowed items float to the top; caller's comparator decides order within each group
    .sort((a, b) => {
      const aAllowed = isAllowed(a.key);
      const bAllowed = isAllowed(b.key);
      if (aAllowed !== bAllowed) return aAllowed ? -1 : 1;
      return sortComparator(a, b);
    });

  const selectableKeys = filteredItems.map(item => item.key);

  const allSelectableSelected = selectableKeys.length > 0 &&
    selectableKeys.every(key => selected.includes(key));

  const anySelectableSelected = selectableKeys.some(key => selected.includes(key));

  const selectAll = () => {
    if (!allSelectableSelected) {
      const merged = new Set([...selected, ...selectableKeys]);
      onChange(Array.from(merged));
    }
  };

  const deSelectAll = () => {
    if (anySelectableSelected) {
      onChange(selected.filter(key => !selectableKeys.includes(key)));
    }
  };

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
        <div className={styles.panelMedium} onClick={() => setIsDropdownOpen(!isDropdownOpen)}></div>
        <div style={{textAlign:'right', color: '#9A9898', padding:'0 5px 0 0'}}>
          {allowedKeys == null ? items.length : allowedKeys.size}
        </div>
        <div
          className={`${styles.toggleArrow} ${isDropdownOpen ? styles.arrowExpanded : styles.arrowCollapsed}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          ▼
        </div>
      </div>

      <div className={`${styles.panelContent} ${isDropdownOpen ? styles.expanded : ''}`}>
        {filteredItems.length > 0 && (
          <div className={styles.characterItem}>
            <button
              type="button"
              className={styles.characterButton}
              disabled={allSelectableSelected}
              onClick={selectAll}
              style={{ pointerEvents: (allSelectableSelected ? 'none' : 'auto'), fontWeight: 600, width: '50%', textAlign: 'left', opacity:(allSelectableSelected ? 0.4 : 1)}}
            >
              {'Select All'}
            </button>
            <button
              type="button"
              className={styles.characterButton}
              disabled={!anySelectableSelected}
              onClick={deSelectAll}
              style={{ pointerEvents: (!anySelectableSelected ? 'none' : 'auto'), fontWeight: 600, width: '50%', textAlign: 'left', opacity:(!anySelectableSelected ? 0.4 : 1)}}
            >
              {'Deselect All'}
            </button>
          </div>
        )}
        <div className={styles.scrollableList}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const allowed = isAllowed(item.key);
              return (
                <div key={item.key} className={styles.characterItem}>
                  <label
                    className={styles.characterButton}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: allowed ? 1 : 0.4,
                      cursor: allowed ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(item.key)}
                      disabled={!allowed}
                      onChange={() => {
                        const next = selected.includes(item.key)
                          ? selected.filter(v => v !== item.key)
                          : [...selected, item.key];
                        onChange(next);
                      }}
                    />
                    {item.label}{item.sublabel ? ` (${item.sublabel})` : ''}
                  </label>
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>No Results Found</div>
          )}
        </div>
      </div>
    </div>
  );
}