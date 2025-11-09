'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../styles/pages/chapterProfile.module.css'; // You might need to adjust this path

// Helper function to remove leading zeros from chapter or poem numbers
function removeLeadingZero(numStr) {
  return parseInt(numStr, 10).toString();
}

// Helper function to get chapter kanji
function getChapterKanji(chapterNum) {
  const chapterKanji = {
    '01': '桐壺', '02': '帚木', '03': '空蝉', '04': '夕顔', '05': '若紫', '06': '末摘花', '07': '紅葉賀', '08': '花宴', '09': '葵',
    '10': '榊', '11': '花散里', '12': '須磨', '13': '明石', '14': '澪標', '15': '蓬生', '16': '関屋', '17': '絵合', '18': '松風',
    '19': '薄雲', '20': '朝顔', '21': '乙女', '22': '玉鬘', '23': '初音', '24': '胡蝶', '25': '螢', '26': '常夏', '27': '篝火',
    '28': '野分', '29': '行幸', '30': '藤袴', '31': '真木柱', '32': '梅枝', '33': '藤裏葉', '34': '若菜上', '35': '若菜下',
    '36': '柏木', '37': '横笛', '38': '鈴虫', '39': '夕霧', '40': '御法', '41': '幻', '42': '匂宮', '43': '紅梅', '44': '竹河',
    '45': '橋姫', '46': '椎本', '47': '総角', '48': '早蕨', '49': '宿木', '50': '東屋', '51': '浮舟', '52': '蜻蛉', '53': '手習',
    '54': '夢浮橋'
  };
  return chapterKanji[chapterNum] || '';
}

// Chapter names matching the kanji
const chapterNames = {
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
  '50': 'Azumaya', '51': 'Ukifune', '52': 'Kagerō', '53': 'Tenarai',
  '54': 'Yume no Ukihashi'
};

export default function ChapterDetail({ name }) {
  const [chapterData, setChapterData] = useState(null);
  const [poems, setPoems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [allChapters, setAllChapters] = useState([]);

  // Handle mouse events for poem hover effects
  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Generate the list of all chapters for the dropdown
  useEffect(() => {
    const chapters = [];
    for (let i = 1; i <= 54; i++) {
      const num = i.toString().padStart(2, '0');
      chapters.push({
        number: num,
        name: chapterNames[num] || `Chapter ${i}`,
        kanji: getChapterKanji(num)
      });
    }
    setAllChapters(chapters);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Open dropdown when typing in search
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  // Filter chapters based on search term
  const filteredChapters = allChapters.filter(chapter => 
    chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.number.includes(searchTerm)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && 
          !event.target.closest(`.${styles.analysisPanel}`) && 
          event.target !== searchInputRef.current) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const res = await fetch(`/api/chapter_profile?name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error('Failed to fetch chapter');
        
        const data = await res.json();
        // console.log("Frontend received data:", data);

        setChapterData({
          ...data.chapter,
          nicktitles: data.nicktitles || [],
        });
        
        // Convert the poems object to an array if it's not already
        const poemsArray = data.poems ? 
          (Array.isArray(data.poems) ? data.poems : Object.values(data.poems)) : 
          [];
        
        // console.log("Poems array:", poemsArray);
        setPoems(poemsArray);
        
      } catch (err) {
        console.error("Error fetching chapter:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChapter();
  }, [name]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!chapterData) return <div className={styles.error}>Chapter not found.</div>;

  // Helper function to process addressee data
  const processAddresseeData = (poem) => {
    // Handle both old format (single addressee) and new format (array of addressees)
    if (poem.addressee_names && Array.isArray(poem.addressee_names)) {
      // New format with arrays
      const validAddressees = poem.addressee_names
        .map((name, index) => ({
          name: name || "",
          gender: poem.addressee_genders?.[index] || ""
        }))
        .filter(addr => addr.name.trim() !== "");
      
      if (validAddressees.length === 0) {
        return { addressee_name: "", addressee_gender: "" };
      }
      
      const addresseeNames = validAddressees.map(addr => addr.name).join(" & ");
      // For styling, use the first addressee's gender, or default if mixed
      const firstGender = validAddressees[0].gender;
      const allSameGender = validAddressees.every(addr => addr.gender === firstGender);
      
      return {
        addressee_name: addresseeNames,
        addressee_gender: allSameGender ? firstGender : ""
      };
    } else {
      // Old format (backward compatibility)
      return {
        addressee_name: poem.addressee_name || "",
        addressee_gender: poem.addressee_gender || ""
      };
    }
  };

  // Format poem numbers to extract chapter and poem numbers
  const formattedPoems = poems.map(poem => {
    const addresseeData = processAddresseeData(poem);
    
    // Assuming pnum format is like '13AK09' where 13 is chapter, 'AK' is chapter abbreviation, and 09 is poem number
    const match = poem.pnum.match(/^(\d+)([A-Z]+)(\d+)$/);
    if (match) {
      return {
        ...poem,
        chapterNum: match[1].padStart(2, '0'),
        chapterAbr: match[2],
        poemNum: match[3],
        chapterKanji: getChapterKanji(match[1].padStart(2, '0')),
        japanese: poem.Japanese,
        romaji: poem.Romaji,
        ...addresseeData
      };
    }
    return {
      ...poem,
      chapterNum: chapterData.chapter_number.padStart(2, '0'),
      chapterAbr: '',
      poemNum: poem.pnum,
      chapterKanji: chapterData.kanji,
      japanese: poem.Japanese,
      romaji: poem.Romaji,
      ...addresseeData
    };
  });

  return (
    <div className={styles.characterProfilePage}>
      <div className={styles.heroSection}>
        <div
          className={styles.fullBackgroundImage}
          style={{ backgroundImage: "url('/images/chapter_banner2.png')" }}
        >
          <div className={styles.titleOverlay}>
            <div className={styles.titleContainer}>
              <span className={styles.nameEnglish}>{chapterData.chapter_name}</span>
              <span className={styles.chapterNumber}>
                {chapterData.chapter_number.padStart(2, '0')}
              </span>
              <span className={styles.poemCount}>
                {formattedPoems.length} {formattedPoems.length === 1 ? 'Poem' : 'Poems'}
              </span>
            </div>
            <span className={styles.nameJapanese}>{chapterData.kanji}</span>
          </div>
        </div>
      </div>

      <div className={styles.characterProfileContainer}>
        {/* Search Dropdown Section */}
        <div className={styles.analysisPanel}>
          <div className={styles.panelHeader}>
            <input
              ref={searchInputRef}
              type="text"
              className={styles.panelHeaderSearch}
              placeholder="Search Chapters"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className={styles.panelMedium} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            </div>
            <div 
              className={`${styles.toggleArrow} ${isDropdownOpen ? styles.arrowExpanded : styles.arrowCollapsed}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              ▼
            </div>
          </div>

          {/* Dropdown content */}
          <div className={`${styles.panelContent} ${isDropdownOpen ? styles.expanded : ''}`}>
            <div className={styles.scrollableList}>
              {filteredChapters.length > 0 ? (
                filteredChapters.map((chapter, index) => (
                  <div key={index} className={styles.characterItem}>
                    <Link 
                      href={`/chapters/${encodeURIComponent(chapter.name)}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <button className={styles.characterButton}>
                        {chapter.number}: {chapter.name} ({chapter.kanji})
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className={styles.noResults}>No Chapters Found</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.mainContent}>
            {/* Chapter Summary Section */}
            <div className={styles.mainSection}>
              <div id="about" className={styles.description}>
                <div className={styles.descriptionContent}>
                  <span
                    style={{
                      color: 'White' // Using blue color for chapter descriptions
                    }}
                  >
                    Chapter {chapterData.chapter_number} Summary
                  </span>

                  {chapterData.nicktitles && Object.values(chapterData.nicktitles).length > 0 && (
                    <div className={styles.nicknameSmall}>
                      AKA: {Object.values(chapterData.nicktitles).join(', ')}
                    </div>
                  )}

                  
                  <div className={styles.descriptionText}>
                    {chapterData.Description ? (
                      <p>
                        {chapterData.Description}
                      </p>
                    ) : (
                      <p className={styles.descriptionPlaceholder}>
                        <i>Chapter summary not available at this time. Under construction.</i>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Poems Section */}
            <div className={styles.poemsSection}>
              <span className={styles.filterResultsLabel}>POEMS IN THIS CHAPTER</span>
              {formattedPoems.length > 0 ? (
                <div className={styles.searchResults}>
                  {formattedPoems.map((poem, index) => (
                    <div
                      key={index}
                      className={`${styles.resultItem} ${hoveredIndex === index ? styles.hovered : ''}`}
                      onMouseEnter={() => handleMouseEnter(index)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <Link href={`/poems/${removeLeadingZero(poem.chapterNum)}/${removeLeadingZero(poem.poemNum)}`}>
                        <div className={styles.resultContent}>
                          <h3
                            className={styles.resultTitleSpeaker}
                            style={{
                              color:
                                poem.speaker_gender === 'male'
                                  ? '#436875'
                                  : poem.speaker_gender === 'female'
                                  ? '#B03F2E'
                                  : 'inherit'
                            }}
                          >
                            {poem.speaker_name} &raquo;
                          </h3>

                          <div className={styles.resultWrapper}>
                            <div className={styles.resultWrapperChapter}>
                              <div className={styles.resultTitle}>
                                {poem.chapterNum}{poem.chapterAbr}
                              </div>
                              <div className={styles.resultTitle}>
                                {poem.poemNum}
                              </div>
                            </div>
                            <div className={styles.resultPoemKanji}>
                              {poem.chapterKanji}
                            </div>
                          </div>
                          <div>
                            <div className={styles.japaneseText}>
                              {poem.japanese.split("\n")[0] || poem.japanese}
                            </div>
                            <div className={styles.romajiText}>
                              {poem.romaji.split("\n")[0] || poem.romaji}
                            </div>
                          </div>
                          <h3 
                            className={styles.resultTitleAddressee}
                            style={{
                              color:
                                poem.addressee_gender === 'male'
                                  ? '#436875'
                                  : poem.addressee_gender === 'female'
                                  ? '#B03F2E'
                                  : 'inherit'
                            }}
                          >
                            &raquo; {poem.addressee_name}
                          </h3>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noPoemsMessage}>No poems found for this chapter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}