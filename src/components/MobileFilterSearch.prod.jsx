import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import styles from '../styles/pages/mobileFilterSearch.module.css';

// Chapter names constant to avoid duplication
const CHAPTER_NAMES = {
  '01': 'Kiritsubo 桐壺', '02': 'Hahakigi 帚木', '03': 'Utsusemi 空蝉', '04': 'Yūgao 夕顔', '05': 'Wakamurasaki 若紫', '06': 'Suetsumuhana 末摘花', '07': 'Momiji no Ga 紅葉賀', '08': 'Hana no En 花宴', '09': 'Aoi 葵', 
  '10': 'Sakaki 榊', '11': 'Hana Chiru Sato 花散里', '12': 'Suma 須磨', '13': 'Akashi 明石', '14': 'Miotsukushi 澪標', '15': 'Yomogiu 蓬生', '16': 'Sekiya 関屋', '17': 'E Awase 絵合', '18': 'Matsukaze 松風', 
  '19': 'Usugumo 薄雲', '20': 'Asagao 朝顔', '21': 'Otome 乙女', '22': 'Tamakazura 玉鬘', '23': 'Hatsune 初音', '24': 'Kochō 胡蝶', '25': 'Hotaru 螢', '26': 'Tokonatsu 常夏', '27': 'Kagaribi 篝火', 
  '28': 'Nowaki 野分', '29': 'Miyuki 行幸', '30': 'Fujibakama 藤袴', '31': 'Makibashira 真木柱', '32': 'Umegae 梅枝', '33': 'Fuji no Uraba 藤裏葉', '34': 'Wakana: Jō 若菜上', '35': 'Wakana: Ge 若菜下', 
  '36': 'Kashiwagi 柏木', '37': 'Yokobue 横笛', '38': 'Suzumushi 鈴虫', '39': 'Yūgiri 夕霧', '40': 'Minori 御法', '41': 'Maboroshi 幻', '42': 'Niou Miya 匂宮', '43': 'Kōbai 紅梅', '44': 'Takekawa 竹河', 
  '45': 'Hashihime 橋姫', '46': 'Shii ga Moto 椎本', '47': 'Agemaki 総角', '48': 'Sawarabi 早蕨', '49': 'Yadorigi 宿木', '50': 'Azumaya 東屋', '51': 'Ukifune 浮舟', '52': 'Kagerō 蜻蛉', '53': 'Tenarai 手習', 
  '54': 'Yume no Ukihashi 夢浮橋'
};

// Helper functions from the original component
const removeLeadingZero = (num) => {
  return num.replace(/^0+/, '');
};

const getChapterName = (String) => {
  const formattedKey = String.toString().padStart(2, '0');
  return CHAPTER_NAMES[formattedKey] || "Unknown Chapter";
};

// Filter chapters based on search input (supports chapter number or name in English/Japanese)
const getFilteredChapters = (searchText) => {
  const search = searchText.toLowerCase().trim();
  
  // If no search text, return all chapters
  if (!search) {
    return Object.entries(CHAPTER_NAMES)
      .map(([chapterNum, chapterName]) => ({
        chapterNum,
        chapterName,
        displayText: `${removeLeadingZero(chapterNum)} - ${chapterName}`,
        numericChapter: parseInt(chapterNum, 10),
        isExactMatch: false,
        startsWithSearch: false
      }))
      .sort((a, b) => a.numericChapter - b.numericChapter);
  }
  
  return Object.entries(CHAPTER_NAMES)
    .filter(([chapterNum, chapterName]) => {
      const paddedMatches = chapterNum.includes(search);
      const unpaddedMatches = removeLeadingZero(chapterNum).includes(search);
      const nameMatches = chapterName.toLowerCase().includes(search);
      return paddedMatches || unpaddedMatches || nameMatches;
    })
    .map(([chapterNum, chapterName]) => ({
      chapterNum,
      chapterName,
      displayText: `${removeLeadingZero(chapterNum)} - ${chapterName}`,
      numericChapter: parseInt(chapterNum, 10),
      isExactMatch: removeLeadingZero(chapterNum) === search,
      startsWithSearch: removeLeadingZero(chapterNum).startsWith(search)
    }))
    .sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      if (a.startsWithSearch && !b.startsWithSearch) return -1;
      if (!a.startsWithSearch && b.startsWithSearch) return 1;
      return a.numericChapter - b.numericChapter;
    });
};

const MobileFilterSearch = () => {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedPoem, setSelectedPoem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Search filters (keep only chapter input alongside main keyword)
  const [searchChapter, setSearchChapter] = useState("");
  
  // Dropdown state for chapter selection
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState("");
  


  // Display options state
  const [displayMode, setDisplayMode] = useState("japanese"); // japanese, romaji, waley, seidensticker, tyler, washburn, cranston
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);

  // Highlight matching keywords
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Search handler
  const handleSearch = useCallback(
    debounce(async (searchQuery) => {
      setIsLoading(true);
      setError(null);

      const queryToUse = searchQuery.trim() ? searchQuery : "=#=";

      try {
        const response = await fetch(`/api/poems/poem_search?q=${encodeURIComponent(queryToUse)}`);

        if (!response.ok) {
          throw new Error("Not found.");
        }

        const data = await response.json();

        if (Array.isArray(data.searchResults)) {
          const processedResults = data.searchResults.map((result) => ({
            chapterNum: Object.values(result.chapterNum).join(""),
            poemNum: Object.values(result.poemNum).join(""),
            chapterAbr: Object.values(result.chapterAbr).join(""),
            japanese: Object.values(result.japanese).join(""),
            romaji: Object.values(result.romaji).join(""),
            paraphrase: result.paraphrase ? Object.values(result.paraphrase).join("") : "",
            addressee_name: typeof result.addressee_name === "string" 
              ? result.addressee_name 
              : Object.values(result.addressee_name).join(""),
            addressee_gender: Object.values(result.addressee_gender).join(""),
            speaker_name: Object.values(result.speaker_name).join(""),
            speaker_gender: Object.values(result.speaker_gender).join(""),
            waley_translation: result.waley_translation ? 
              (typeof result.waley_translation === 'string' ? result.waley_translation : Object.values(result.waley_translation).join("")) : "",
            seidensticker_translation: result.seidensticker_translation ? 
              (typeof result.seidensticker_translation === 'string' ? result.seidensticker_translation : Object.values(result.seidensticker_translation).join("")) : "",
            tyler_translation: result.tyler_translation ? 
              (typeof result.tyler_translation === 'string' ? result.tyler_translation : Object.values(result.tyler_translation).join("")) : "",
            washburn_translation: result.washburn_translation ? 
              (typeof result.washburn_translation === 'string' ? result.washburn_translation : Object.values(result.washburn_translation).join("")) : "",
            cranston_translation: result.cranston_translation ? 
              (typeof result.cranston_translation === 'string' ? result.cranston_translation : Object.values(result.cranston_translation).join("")) : "",
          }));          setResults(processedResults);
          setShowResults(true);
        } else {
          throw new Error("Received unexpected data structure from server");
        }
      } catch (error) {
        console.error("Search error:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [setIsLoading, setError, setResults, setShowResults]
  );

  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  // Filter results based on selected chapter filter
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // If a specific chapter is selected, only show poems from that chapter
      if (selectedChapter) {
        // Handle both padded ("01") and unpadded ("1") chapter numbers
        const resultChapterPadded = result.chapterNum.padStart(2, '0');
        const selectedChapterPadded = selectedChapter.padStart(2, '0');
        return resultChapterPadded === selectedChapterPadded;
      }
      
      // If no specific chapter is selected, show all results
      return true;
    });
  }, [results, selectedChapter]);

  const handlePoemClick = (poem) => {
    setSelectedPoem(poem);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPoem(null);
  };

  // Close modal with Escape key for accessibility
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && showModal) closeModal();
      if (e.key === 'Escape' && showDisplayOptions) setShowDisplayOptions(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal, showDisplayOptions]);

  // Close display options when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDisplayOptions && 
          e.target.closest(`[class*="displayOptionsOverlay"]`) &&
          !e.target.closest(`[class*="displayOptionsPopup"]`)) {
        setShowDisplayOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDisplayOptions]);

  // Handle chapter dropdown interactions
  const handleChapterInputChange = (e) => {
    const value = e.target.value;
    
    // If user starts deleting from a selected chapter, clear the selection and input
    if (selectedChapter) {
      // Get the current selected chapter's display text
      const allChapters = Object.entries(CHAPTER_NAMES).map(([chapterNum, chapterName]) => ({
        chapterNum,
        displayText: `${removeLeadingZero(chapterNum)} - ${chapterName}`
      }));
      
      // Find the current chapter by comparing padded versions
      const currentChapterData = allChapters.find(ch => {
        const chapterPadded = ch.chapterNum.padStart(2, '0');
        const selectedPadded = selectedChapter.padStart(2, '0');
        return chapterPadded === selectedPadded;
      });
      
      // If the input no longer matches the selected chapter's display text exactly, clear everything
      if (!currentChapterData || value !== currentChapterData.displayText) {
        setSelectedChapter("");
        setSearchChapter(""); // Clear the input text as well
        setShowChapterDropdown(false);
        return; // Exit early since we're clearing everything
      }
    }
    
    // Only update the search chapter if we're not clearing it above
    setSearchChapter(value);
    setShowChapterDropdown(true); // Always show dropdown when typing
  };

  const handleChapterInputFocus = () => {
    // Always show dropdown on focus, even if empty
    setShowChapterDropdown(true);
  };

  const handleChapterInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowChapterDropdown(false), 200);
  };

  const handleChapterSelect = (chapter) => {
    setSearchChapter(chapter.displayText);
    setSelectedChapter(chapter.chapterNum);
    setShowChapterDropdown(false);
  };

  const clearChapterFilter = () => {
    setSelectedChapter("");
    setSearchChapter("");
    setShowChapterDropdown(false);
  };

  // Get filtered chapters for dropdown
  const filteredChapters = useMemo(() => {
    return getFilteredChapters(searchChapter);
  }, [searchChapter]);

  const clearAllFilters = () => {
    setSelectedChapter("");
    setSearchChapter("");
    setQuery("");
    setShowChapterDropdown(false);
  };

  // Function to render poem text based on display mode
  const renderPoemText = (result) => {
    // Helper function to truncate translation to first few words
    const truncateTranslation = (text, maxWords = 8) => {
      if (!text) return '';
      const words = text.trim().split(/\s+/);
      return words.length <= maxWords ? text : words.slice(0, maxWords).join(' ') + '...';
    };

    // Shared style for translation text with auto-truncation
    const translationStyle = {
      display: 'block', 
      width: '100%', 
      color: '#1f1f1f', 
      fontSize: '16px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '100%',
      textAlign: 'center'
    };

    switch (displayMode) {
      case 'japanese':
        return (
          <div className={styles.japanese}>
            {highlightMatch(result.japanese.split("\n")[0], query)}
          </div>
        );
      case 'romaji':
        return (
          <div className={styles.romaji}>
            {result.romaji ? highlightMatch(result.romaji.split("\n")[0], query) : 'No romaji available'}
          </div>
        );
      case 'waley':
        const waleyText = result.waley_translation || '';
        const waleyFirstLine = waleyText.split('\n').filter(line => line.trim())[0] || '';
        const waleyTruncated = truncateTranslation(waleyFirstLine);
        return (
          <div className={styles.translation} style={translationStyle}>
            {waleyTruncated ? highlightMatch(waleyTruncated, query) : 'No Waley translation available'}
          </div>
        );
      case 'seidensticker':
        const seidenstrickerText = result.seidensticker_translation || '';
        const seidenstrickerFirstLine = seidenstrickerText.split('\n').filter(line => line.trim())[0] || '';
        const seidenstrickerTruncated = truncateTranslation(seidenstrickerFirstLine);
        return (
          <div className={styles.translation} style={translationStyle}>
            {seidenstrickerTruncated ? highlightMatch(seidenstrickerTruncated, query) : 'No Seidensticker translation available'}
          </div>
        );
      case 'tyler':
        const tylerText = result.tyler_translation || '';
        const tylerFirstLine = tylerText.split('\n').filter(line => line.trim())[0] || '';
        const tylerTruncated = truncateTranslation(tylerFirstLine);
        return (
          <div className={styles.translation} style={translationStyle}>
            {tylerTruncated ? highlightMatch(tylerTruncated, query) : 'No Tyler translation available'}
          </div>
        );
      case 'washburn':
        const washburnText = result.washburn_translation || '';
        const washburnFirstLine = washburnText.split('\n').filter(line => line.trim())[0] || '';
        const washburnTruncated = truncateTranslation(washburnFirstLine);
        return (
          <div className={styles.translation} style={translationStyle}>
            {washburnTruncated ? highlightMatch(washburnTruncated, query) : 'No Washburn translation available'}
          </div>
        );
      case 'cranston':
        const cranstonText = result.cranston_translation || '';
        const cranstonFirstLine = cranstonText.split('\n').filter(line => line.trim())[0] || '';
        const cranstonTruncated = truncateTranslation(cranstonFirstLine);
        return (
          <div className={styles.translation} style={translationStyle}>
            {cranstonTruncated ? highlightMatch(cranstonTruncated, query) : 'No Cranston translation available'}
          </div>
        );
      default:
        return (
          <div className={styles.japanese}>
            {highlightMatch(result.japanese.split("\n")[0], query)}
          </div>
        );
    }
  };

  return (
    <div className={styles.mobileSearch}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}></div>
        <h1 className={styles.title}>Poem Search</h1>
        <div className={styles.headerRight}>
          <button 
            className={styles.gearButton}
            onClick={() => setShowDisplayOptions(!showDisplayOptions)}
            aria-label="Display options"
          >
            <img src="/images/gear.png" alt="Settings" className={styles.gearIcon} />
          </button>
        </div>
      </div>

      {/* Display Options Popup */}
      {showDisplayOptions && (
        <div className={styles.displayOptionsOverlay}>
          <div className={styles.displayOptionsPopup}>
            <div className={styles.displayOptionsHeader}>
              <h3 className={styles.displayOptionsTitle}>Display Options</h3>
              <button 
                className={styles.closeDisplayOptions}
                onClick={() => setShowDisplayOptions(false)}
                aria-label="Close display options"
              >
                ×
              </button>
            </div>
            <div className={styles.displayOptionsList}>
              <div 
                className={`${styles.displayOption} ${displayMode === 'japanese' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('japanese');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Japanese</span>
                {displayMode === 'japanese' && <span className={styles.checkmark}>✓</span>}
              </div>
              <div 
                className={`${styles.displayOption} ${displayMode === 'romaji' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('romaji');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Romaji</span>
                {displayMode === 'romaji' && <span className={styles.checkmark}>✓</span>}
              </div>
              <div 
                className={`${styles.displayOption} ${displayMode === 'waley' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('waley');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Waley Translation</span>
                {displayMode === 'waley' && <span className={styles.checkmark}>✓</span>}
              </div>
              <div 
                className={`${styles.displayOption} ${displayMode === 'seidensticker' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('seidensticker');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Seidensticker Translation</span>
                {displayMode === 'seidensticker' && <span className={styles.checkmark}>✓</span>}
              </div>
              <div 
                className={`${styles.displayOption} ${displayMode === 'tyler' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('tyler');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Tyler Translation</span>
                {displayMode === 'tyler' && <span className={styles.checkmark}>✓</span>}
              </div>
              <div 
                className={`${styles.displayOption} ${displayMode === 'washburn' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('washburn');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Washburn Translation</span>
                {displayMode === 'washburn' && <span className={styles.checkmark}>✓</span>}
              </div>
              <div 
                className={`${styles.displayOption} ${displayMode === 'cranston' ? styles.selected : ''}`}
                onClick={() => {
                  setDisplayMode('cranston');
                  setShowDisplayOptions(false);
                }}
              >
                <span className={styles.optionLabel}>Cranston Translation</span>
                {displayMode === 'cranston' && <span className={styles.checkmark}>✓</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Inputs */}
      <div className={styles.searchSection}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search poem text..."
          className={styles.mainSearchInput}
        />

        <div className={styles.filterInputs}>
          <div className={styles.chapterInputContainer}>
            <input
              type="text"
              value={searchChapter}
              onChange={handleChapterInputChange}
              onFocus={handleChapterInputFocus}
              onBlur={handleChapterInputBlur}
              placeholder="Filter chapters..."
              className={styles.filterInput}
            />
            
            {/* Clear Chapter Button - only shows when chapter is selected */}
            {selectedChapter && (
              <button 
                className={styles.clearChapterButton}
                onClick={clearChapterFilter}
                aria-label="Clear chapter filter"
              >
                ×
              </button>
            )}
            
            {/* Chapter Dropdown */}
            {showChapterDropdown && (
              <div className={styles.chapterDropdown}>
                {filteredChapters.map((chapter) => (
                  <div
                    key={chapter.chapterNum}
                    className={styles.chapterOption}
                    onClick={() => handleChapterSelect(chapter)}
                  >
                    {chapter.displayText}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && <div className={styles.loading}>Searching...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {/* Results Header Row - only show when we have results */}
      {showResults && filteredResults.length > 0 && (
        <div className={styles.resultsHeader}>
          <div className={styles.resultsCount}>
            {filteredResults.length} poems found
          </div>
          <button className={styles.resultsClearButton} onClick={clearAllFilters}>
            Clear All
          </button>
        </div>
      )}

      {/* Results List */}
      {showResults && filteredResults.length > 0 && (
        <div className={styles.resultsList}>
          {filteredResults.map((result, index) => (
            <div
              key={index}
              className={styles.resultItem}
              onClick={() => handlePoemClick(result)}
            >
              <div className={styles.resultHeader}>
                <div className={styles.poemNumbers}>
                  <span className={styles.chapterNum}>{removeLeadingZero(result.chapterNum)}</span>
                  <span className={styles.poemNum}>{removeLeadingZero(result.poemNum)}</span>
                </div>
                <div className={styles.chapterKanji}>
                  {getChapterName(result.chapterNum)}
                </div>
              </div>
              
              <div className={styles.participants}>
                <span 
                  className={styles.speaker}
                  style={{
                    color: result.speaker_gender === 'male' ? '#436875' : 
                           result.speaker_gender === 'female' ? '#B03F2E' : 'inherit'
                  }}
                >
                  {result.speaker_name}
                </span>

                <div className={styles.poemText}>
                  {renderPoemText(result)}
                </div>

                <span 
                  className={styles.addressee}
                  style={{
                    color: result.addressee_gender === 'male' ? '#436875' : 
                           result.addressee_gender === 'female' ? '#B03F2E' : 'inherit'
                  }}
                >
                  {result.addressee_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query && results.length === 0 && !isLoading && !error && (
        <div className={styles.noResults}>No results found</div>
      )}

      {/* Modal for Poem Details */}
      {showModal && selectedPoem && (
        <div className={styles.modal} onClick={closeModal} role="dialog" aria-modal="true">
          <button className={styles.closeButton} onClick={closeModal} aria-label="Close">×</button>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            
            <div className={styles.modalHeader}>
                <div className={styles.modalHeaderLeft}>
                    <div className={styles.poemNumbers}>
                        <span className={styles.chapterNum}>{removeLeadingZero(selectedPoem.chapterNum)}</span>
                        <span className={styles.poemNum}>{removeLeadingZero(selectedPoem.poemNum)}</span>
                    </div>
                    <div className={styles.chapterNameHeader}>
                        {getChapterName(selectedPoem.chapterNum)}
                    </div>              
                </div>
            </div>

            <div className={styles.modalPoemText}>
              <div className={styles.modalJapanese}>
                {(() => {
                  const joined = (selectedPoem.japanese || '').split("\n").join('');
                  return <div className={styles.modalJapaneseInline}>{highlightMatch(joined, query)}</div>;
                })()}
              </div>
            </div>

            <div className={styles.translationsCompact}>
              {selectedPoem.waley_translation && (
                <div className={styles.translationTile}>
                  <div>
                    {(selectedPoem.waley_translation || '').split('\n').filter(line => line.trim()).map((line, index) => (
                      <p key={`waley-${index}`}>{highlightMatch(line, query)}</p>
                    ))}
                  </div>
                  <div className={styles.translatorBadge}>Waley</div>
                </div>
              )}

              {selectedPoem.seidensticker_translation && (
                <div className={styles.translationTile}>
                  <div>
                    {(selectedPoem.seidensticker_translation || '').split('\n').filter(line => line.trim()).map((line, index) => (
                      <p key={`seidensticker-${index}`}>{highlightMatch(line, query)}</p>
                    ))}
                  </div>
                  <div className={styles.translatorBadge}>Seidensticker</div>
                </div>
              )}

              {selectedPoem.tyler_translation && (
                <div className={styles.translationTile}>
                  <div>
                    {(selectedPoem.tyler_translation || '').split('\n').filter(line => line.trim()).map((line, index) => (
                      <p key={`tyler-${index}`}>{highlightMatch(line, query)}</p>
                    ))}
                  </div>
                  <div className={styles.translatorBadge}>Tyler</div>
                </div>
              )}

              {selectedPoem.washburn_translation && (
                <div className={styles.translationTile}>
                  <div>
                    {(selectedPoem.washburn_translation || '').split('\n').filter(line => line.trim()).map((line, index) => (
                      <p key={`washburn-${index}`}>{highlightMatch(line, query)}</p>
                    ))}
                  </div>
                  <div className={styles.translatorBadge}>Washburn</div>
                </div>
              )}

              {selectedPoem.cranston_translation && (
                <div className={styles.translationTile}>
                  <div>
                    {(selectedPoem.cranston_translation || '').split('\n').filter(line => line.trim()).map((line, index) => (
                      <p key={`cranston-${index}`}>{highlightMatch(line, query)}</p>
                    ))}
                  </div>
                  <div className={styles.translatorBadge}>Cranston</div>
                </div>
              )}
            </div>

            {selectedPoem.paraphrase && (
              <div className={styles.modalParaphrase}>
                <h4>Paraphrase</h4>
                <p>{highlightMatch(selectedPoem.paraphrase, query)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MobileFilterSearch);