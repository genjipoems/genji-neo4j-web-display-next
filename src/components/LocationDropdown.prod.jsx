'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/pages/chapterProfile.module.css';

const LOCATION_NAMES = [
  'The Seiryōden',
  'Nijō (Genji\'s villa)',
  'The Kiritsubo',
  'The Kōrōden',
  'The nurse\'s residence (a ruined estate in the capital)',
  'Hanachirusato\'s villa (the scattering orange blossoms)',
  'Home of Genji\'s Grandmother',
  'Sumiyoshi Shrine',
  'Indeterminate (text does not specify)',
  'Naniwa (the Horie canal)',
  'Naniwa (Tamino Island)',
  'Naniwa (the inlet)',
  'Lady Rokujō\'s residence (Rokujō)',
  'An Untenanted Mansion',
  'The Palace',
  'The West Garden',
  'The Hitachi villa (Suetsumuhana\'s ruined estate)',
  'Fujitsubo\'s villa on Sanjō Avenue',
  'The Ōsaka Barrier (the gatehouse at Ōsaka Pass)',
  'Governor of Kii\'s Mansion',
  'The former Hitachi Deputy\'s residence (in the capital)',
  'Suma (Genji\'s villa in exile)',
  'Yūgao\'s House on Gojō',
  'The Umetsubo (Akikonomu\'s chambers, the plum courtyard)',
  'The palace (the ladies\' picture debate before Fujitsubo)',
  'Home of the Bishop of Kitayama',
  'Koremitsu\'s Mother\'s House on Gojō',
  'The Kokiden',
  'The boat departing Akashi',
  'House of the Finger Biting Lady',
  'Home of the Warden\'s Lady',
  'Yūgao\'s Original House',
  'The Ōi villa (the Akashi Lady\'s residence near Katsura)',
  'The Chinese Scholar\'s Daughter\'s House',
  'Nokiba no Ogi\'s marital home',
  'Genji\'s Katsura villa',
  'The Late Major Counselor\'s residence',
  'The Secret Love\'s residence',
  'Fujitsubo\'s palace residence (the Higyōsha)',
  'The Sanjō estate (Princess Ōmiya\'s residence)',
  'En route from the Sanjō residence to Nijō (dawn)',
  'Gen no Naishi\'s chambers at the palace',
  'Tō no Chūjō\'s billet at the palace',
  'The Shishinden',
  'The Minister of the Right\'s residence',
  'The lustration procession (the carriage quarrel)',
  'The Kamo Festival (the viewing ground)',
  'The site of Lady Rokujō\'s healing rites',
  'Princess Asagao\'s residence',
  'The temporary shrine at Nonomiya (the plains of Sagano)',
  'The palace (the Ceremony of Parting)',
  'The barrier gate at Ōsaka (Ōsaka no seki)',
  'The late Retired Emperor\'s villa',
  'The palace (the passageway near the Kokiden)',
  'The Suzaku Palace (Retired Emperor Suzaku\'s residence)',
  'The Urin\'in Temple (north of the capital)',
  'The Kamo Shrine',
  'The palace (Fujitsubo\'s withdrawal)',
  'The palace (Oborozukiyo\'s quarters)',
  'Tō no Chūjō\'s residence',
  'A woman\'s house at Nakagawa',
  'The Reikeiden Consort\'s villa',
  'The Rokujō estate (Genji\'s mansion)',
  'The road by the Lower Kamo Shrine',
  'The Retired Emperor\'s tomb (hills north of the capital)',
  'The Crown Prince\'s quarters at the palace',
  'On the journey to Suma (the ruined Ōe villa, Yodo River)',
  'The household in Hizen Province (Tamakazura\'s Kyūshū home)',
  'The Ise Shrine',
  'The Gosechi dancer\'s barge (passing Suma)',
  'The shore at Suma (the purification site)',
  'The Akashi villa (Genji\'s seaside residence)',
  'The Akashi Lady\'s villa (foot of the hills)',
  'The road at Akashi (en route to the Lady\'s villa)',
  'Akashi (Genji\'s departure for the capital)',
  'The palace (Genji\'s audience with Suzaku)',
  'The Hitachi villa',
  'The Ise departure procession (passing Genji\'s Nijō villa)',
  'At sea, fleeing Kyūshū for the capital',
  'Hasedera (the Hatsuse Kannon temple)',
  'The Kujō lodging (Tamakazura\'s residence in the capital)',
  'Ōharano (the imperial excursion)',
  'Higekuro\'s residence',
  'The palace (Tamakazura\'s Shōkyōden quarters)',
  'The Kamo Festival procession',
  'Suzaku\'s mountain temple (his retreat)',
  'En route from the Rokujō estate (the shared carriage)',
  'The Ichijō villa (the Second Princess\'s residence)',
  'The Reizei villa (Retired Emperor Reizei\'s residence)',
  'The Ono villa (the mountain retreat near Mt. Hiei)',
  'Kōbai\'s residence',
  'The palace',
  'Tamakazura\'s residence',
  'The Uji villa (the Eighth Prince\'s residence)',
  'En route to Uji (Kaoru\'s night journey)',
  'The Minister\'s Uji estate (Yūgiri\'s, across the river)',
  'Uji (Niou\'s maple-viewing excursion)',
  'The palace (the First Princess\'s chambers)',
  'The palace (Niou\'s confinement)',
  'The mountain temple above Uji (the ascetic\'s retreat)',
  'En route from Uji to the capital (Naka no Kimi\'s move)',
  'Kaoru\'s Sanjō residence (the Third Princess\'s, rebuilt)',
  'The Fujitsubo (the Second Princess\'s palace quarters)',
  'The Vice Governor of Hitachi\'s residence',
  'The small house near Sanjō (Ukifune\'s hideaway)',
  'En route to Uji (Kaoru bringing Ukifune)',
  'On the Uji River (the boat to the Isle of Tachibana)',
  'The house across the Uji River (the Tachibana hideaway)',
  'Outside the Uji villa (Niou\'s failed night visit)',
  'The Rokujō estate (the First Princess\'s quarters)',
  'The nuns\' residence at Ono',
  'The capital (the Middle Captain\'s residence)',
  'Naniwa (the Akashi Lady\'s boat)',
  'Koremitsu\'s residence'
];

export default function LocationDropdown({ value, onChange, allowedKeys = null }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  const normalize = (str) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const currentDisplay = selected.length === 0
      ? "Select Locations"
      : selected.length === 1
      ? selected[0]
      : `${selected.length} places selected`;

  const isAllowed = (name) => allowedKeys === null || allowedKeys.has(name);

  const filteredLocations = LOCATION_NAMES
    .filter(name => normalize(name).includes(normalize(searchTerm)))
    // allowed locations float to the top; alphabetical within each group
    .sort((a, b) => {
      const aAllowed = isAllowed(a);
      const bAllowed = isAllowed(b);
      if (aAllowed !== bAllowed) return aAllowed ? -1 : 1;
      return a.localeCompare(b);
    });

  // "Select All" only acts on allowed, currently-visible locations
  const selectableNames = filteredLocations.filter(isAllowed);
  const allSelectableSelected = selectableNames.length > 0 &&
    selectableNames.every(name => selected.includes(name));

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      onChange(selected.filter(name => !selectableNames.includes(name)));
    } else {
      const merged = new Set([...selected, ...selectableNames]);
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
          placeholder={currentDisplay}
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
        {filteredLocations.length > 0 && (
          <div className={styles.characterItem}>
            <button
              type="button"
              className={styles.characterButton}
              onClick={toggleSelectAll}
              style={{ fontWeight: 600, width: '100%', textAlign: 'left' }}
            >
              {allSelectableSelected ? 'Deselect All' : 'Select All'}
              {searchTerm ? ` (${selectableNames.length} shown)` : ''}
            </button>
          </div>
        )}
        <div className={styles.scrollableList}>
          {filteredLocations.length > 0 ? (
            filteredLocations.map((name) => {
              const allowed = isAllowed(name);
              return (
                <div key={name} className={styles.characterItem}>
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
                      checked={selected.includes(name)}
                      disabled={!allowed}
                      onChange={() => {
                          const next = selected.includes(name)
                              ? selected.filter(v => v !== name)
                              : [...selected, name];
                          onChange(next);
                      }}
                    />
                    {name}
                  </label>
                </div>
              );
            })
          ) : (
            <div className={styles.noResults}>No Locations Found</div>
          )}
        </div>
      </div>
    </div>
  );
}