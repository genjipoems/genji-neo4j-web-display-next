'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/pages/chapterProfile.module.css';

const CHAPTER_NAMES = {
  '01': 'Kiritsubo', '02': 'Hahakigi', '03': 'Utsusemi', '04': 'Yūgao', '05': 'Wakamurasaki', 
  '06': 'Suetsumuhana', '07': 'Momiji no Ga', '08': 'Hana no En', '09': 'Aoi',
  '10': 'Sakaki', '11': 'Hanachirusato', '12': 'Suma', '13': 'Akashi', '14': 'Miotsukushi', 
  '15': 'Yomogiu', '16': 'Sekiya', '17': 'E-awase', '18': 'Matsukaze',
  '19': 'Usugumo', '20': 'Asagao', '21': 'Otome', '22': 'Tamakazura', '23': 'Hatsune', 
  '24': 'Kochō', '25': 'Hotaru', '26': 'Tokonatsu', '27': 'Kagaribi',
  '28': 'Nowaki', '29': 'Miyuki', '30': 'Fujibakama', '31': 'Makibashira', '32': 'Umegae', 
  '33': 'Fuji no Uraba', '34': 'Wakana: Jō', '35': 'Wakana: Ge',
  '36': 'Kashiwagi', '37': 'Yokobue', '38': 'Suzumushi', '39': 'Yūgiri', '40': 'Minori', 
  '41': 'Maboroshi', '42': 'Niou Miya', '43': 'Kōbai', '44': 'Takekawa',
  '45': 'Hashihime', '46': 'Shiigamoto', '47': 'Agemaki', '48': 'Sawarabi', '49': 'Yadorigi', 
  '50': 'Azumaya', '51': 'Ukifune', '52': 'Kagerō', '53': 'Tenarai', '54': 'Yume no Ukihashi'
};

const CHAPTER_KANJI = {
  '01': '桐壺', '02': '帚木', '03': '空蝉', '04': '夕顔', '05': '若紫', '06': '末摘花', '07': '紅葉賀', '08': '花宴', '09': '葵',
  '10': '榊', '11': '花散里', '12': '須磨', '13': '明石', '14': '澪標', '15': '蓬生', '16': '関屋', '17': '絵合', '18': '松風',
  '19': '薄雲', '20': '朝顔', '21': '乙女', '22': '玉鬘', '23': '初音', '24': '胡蝶', '25': '螢', '26': '常夏', '27': '篝火',
  '28': '野分', '29': '行幸', '30': '藤袴', '31': '真木柱', '32': '梅枝', '33': '藤裏葉', '34': '若菜上', '35': '若菜下',
  '36': '柏木', '37': '横笛', '38': '鈴虫', '39': '夕霧', '40': '御法', '41': '幻', '42': '匂宮', '43': '紅梅', '44': '竹河',
  '45': '橋姫', '46': '椎本', '47': '総角', '48': '早蕨', '49': '宿木', '50': '東屋', '51': '浮舟', '52': '蜻蛉', '53': '手習', '54': '夢浮橋'
};

export default function ChapterDropdown({ value, onChange, allowedKeys = null }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const currentChapterName = CHAPTER_NAMES[value] ? `${value} ${CHAPTER_NAMES[value]}` : "";
  const selected = Array.isArray(value) ? value : [value].filter(Boolean);
  
  const currentDisplay = selected.length === 0
      ? "Select Chapters"
      : selected.length === 1
      ? `${selected[0]} ${CHAPTER_NAMES[selected[0]]}`
      : `${selected.length} chapters selected`;

  const isAllowed = (chapterNum) => allowedKeys === null || allowedKeys.has(chapterNum);

  const allChapters = Object.keys(CHAPTER_NAMES)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((num) => ({
      number: num,
      name: CHAPTER_NAMES[num],
      kanji: CHAPTER_KANJI[num]
    }));

  const filteredChapters = allChapters
    .filter(chapter => 
      chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chapter.number.includes(searchTerm)
    )
    // allowed chapters float to the top; original chapter order preserved within each group
    .sort((a, b) => {
      const aAllowed = isAllowed(a.number);
      const bAllowed = isAllowed(b.number);
      if (aAllowed !== bAllowed) return aAllowed ? -1 : 1;
      return parseInt(a.number, 10) - parseInt(b.number, 10);
    });

  // "Select All" only ever acts on allowed, currently-visible chapters —
  // selecting a greyed-out chapter isn't something the button should do.
  const selectableNumbers = filteredChapters
    .filter(c => isAllowed(c.number))
    .map(c => c.number);
  const allSelectableSelected = selectableNumbers.length > 0 &&
    selectableNumbers.every(num => selected.includes(num));

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      onChange(selected.filter(num => !selectableNumbers.includes(num)));
    } else {
      const merged = new Set([...selected, ...selectableNumbers]);
      onChange(Array.from(merged));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest(`.${styles.analysisPanel}`)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className={styles.analysisPanel}>
      <div className={styles.panelHeader}>
        <input
          ref={searchInputRef}
          type="text"
          className={styles.panelHeaderSearch}
          placeholder={currentChapterName || "Search Chapters"}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isDropdownOpen) setIsDropdownOpen(true);
          }}
        />
        <div className={styles.panelMedium} onClick={() => setIsDropdownOpen(!isDropdownOpen)}></div>
        <div 
          className={`${styles.toggleArrow} ${isDropdownOpen ? styles.arrowExpanded : styles.arrowCollapsed}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          ▼
        </div>
      </div>

      <div className={`${styles.panelContent} ${isDropdownOpen ? styles.expanded : ''}`}>
        {filteredChapters.length > 0 && (
          <div className={styles.characterItem}>
            <button
              type="button"
              className={styles.characterButton}
              onClick={toggleSelectAll}
              style={{ fontWeight: 600, width: '100%', textAlign: 'left' }}
            >
              {allSelectableSelected ? 'Deselect All' : 'Select All'}
              {searchTerm ? ` (${selectableNumbers.length} shown)` : ''}
            </button>
          </div>
        )}
        <div className={styles.scrollableList}>
          {filteredChapters.length > 0 ? (
            filteredChapters.map((chapter) => {
              const allowed = isAllowed(chapter.number);
              return (
                <div key={chapter.number} className={styles.characterItem}>
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
                      checked={selected.includes(chapter.number)}
                      disabled={!allowed}
                      onChange={() => {
                          const next = selected.includes(chapter.number)
                              ? selected.filter(v => v !== chapter.number)
                              : [...selected, chapter.number];
                          onChange(next);
                      }}
                    />
                    {chapter.number}: {chapter.name} ({chapter.kanji})
                  </label>
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>No Chapters Found</div>
          )}
        </div>
      </div>
    </div>
  );
}