import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import Link from 'next/link';
import styles from '../styles/pages/poemKeywordSearch.module.css';
import {BackTop} from 'antd';

// funtion to remove leading zero of chapternum and poemnum, ensure the correctness of link
const removeLeadingZero = (num) => {
  return num.replace(/^0+/, '');
};

const getChapterName = (String) => {
  const chapterNames = {'1':'Kiritsubo 桐壺','2':'Hahakigi 帚木','3':'Utsusemi 空蝉','4':'Yūgao 夕顔','5':'Wakamurasaki 若紫','6':'Suetsumuhana 末摘花','7':'Momiji no Ga 紅葉賀','8':'Hana no En 花宴','9':'Aoi 葵','10':'Sakaki 榊','11':'Hana Chiru Sato 花散里','12':'Suma 須磨','13':'Akashi 明石','14':'Miotsukushi 澪標','15':'Yomogiu 蓬生','16':'Sekiya 関屋','17':'E Awase 絵合','18':'Matsukaze 松風','19':'Usugumo 薄雲','20':'Asagao 朝顔','21':'Otome 乙女','22':'Tamakazura 玉鬘','23':'Hatsune 初音','24':'Kochō 胡蝶','25':'Hotaru 螢','26':'Tokonatsu 常夏','27':'Kagaribi 篝火','28':'Nowaki 野分','29':'Miyuki 行幸','30':'Fujibakama 藤袴','31':'Makibashira 真木柱','32':'Umegae 梅枝','33':'Fuji no Uraba 藤裏葉','34':'Wakana: Jō 若菜上','35':'Wakana: Ge 若菜下','36':'Kashiwagi 柏木','37':'Yokobue 横笛','38':'Suzumushi 鈴虫','39':'Yūgiri 夕霧','40':'Minori 御法','41':'Maboroshi 幻','42':'Niou Miya 匂宮','43':'Kōbai 紅梅','44':'Takekawa 竹河','45':'Hashihime 橋姫','46':'Shii ga Moto 椎本','47':'Agemaki 総角','48':'Sawarabi 早蕨','49':'Yadorigi 宿木','50':'Azumaya 東屋','51':'Ukifune 浮舟','52':'Kagerō 蜻蛉','53':'Tenarai 手習','54':'Yume no Ukihashi 夢浮橋'};
  return chapterNames[String];
}

const getChapterName_noJP = (String) => {
  const chapterNames = {'1':'Kiritsubo','2':'Hahakigi','3':'Utsusemi','4':'Yūgao','5':'Wakamurasaki','6':'Suetsumuhana','7':'Momiji no Ga','8':'Hana no En','9':'Aoi','10':'Sakaki','11':'Hana Chiru Sato','12':'Suma','13':'Akashi','14':'Miotsukushi','15':'Yomogiu','16':'Sekiya','17':'E Awase','18':'Matsukaze','19':'Usugumo','20':'Asagao','21':'Otome','22':'Tamakazura','23':'Hatsune','24':'Kochō','25':'Hotaru','26':'Tokonatsu','27':'Kagaribi','28':'Nowaki','29':'Miyuki','30':'Fujibakama','31':'Makibashira','32':'Umegae','33':'Fuji no Uraba','34':'Wakana: Jō','35':'Wakana: Ge','36':'Kashiwagi','37':'Yokobue','38':'Suzumushi','39':'Yūgiri','40':'Minori','41':'Maboroshi','42':'Niou Miya','43':'Kōbai','44':'Takekawa','45':'Hashihime','46':'Shii ga Moto','47':'Agemaki','48':'Sawarabi','49':'Yadorigi','50':'Azumaya','51':'Ukifune','52':'Kagerō','53':'Tenarai','54':'Yume no Ukihashi'};
  return chapterNames[String];
}

const PoemSearch = () => {
  const [query, setQuery] = useState('');
  const [groupedResults, setGroupedResults] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState('all');
  const searchInputRef = useRef(null);
  const [PoemTotalNum, setPoemTotalNum] = useState(0);
  const allResults = useMemo(() => Object.values(groupedResults).flat(), [groupedResults]);
  
  // use memo to avoid generating full results again when selecting back to 'All chapters' tile
  const resultsToRender = useMemo(() => {
    return selectedChapter === 'all' ? allResults : (groupedResults[selectedChapter] || []);
  }, [selectedChapter, allResults, groupedResults]);

  // highlight matching keywords
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      index % 2 === 1 ? <mark key={index} className={styles.highlight}>{part}</mark> : part
    );
  };

  const groupResultsByChapter = (results) => {
    return results.reduce((acc, result) => {
      const chapter = result.chapterNum;
      if (!acc[chapter]) {
        acc[chapter] = [];
      }
      acc[chapter].push(result);
      return acc;
    }, {});
  };

  const handleSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setGroupedResults({});
        setShowResults(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/poems/poem_search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Not found.');
        }
        const data = await response.json();

        //console.log("searchresult:", data.searchResults)

        if (Array.isArray(data.searchResults)) {
          const processedResults = data.searchResults.map(result => ({
            chapterNum: removeLeadingZero(Object.values(result.chapterNum).join('')),
            poemNum: removeLeadingZero(Object.values(result.poemNum).join('')),
            japanese: Object.values(result.japanese).join(''),
            romaji: Object.values(result.romaji).join(''),
            waley_translation: Object.values(result.waley_translation).join(''),
            seidensticker_translation:Object.values(result.seidensticker_translation).join(''),
            tyler_translation: Object.values(result.tyler_translation).join(''),
            washburn_translation: Object.values(result.washburn_translation).join(''),
            cranston_translation: Object.values(result.cranston_translation).join('')
          }));
          console.log(processedResults)
          const grouped = groupResultsByChapter(processedResults);
          setGroupedResults(grouped);
          setShowResults(true);
          setSelectedChapter('all');
          //console.log("groupResultKey:", Object.keys(groupedResults));
          //console.log("groupResultValue:", Object.values(groupedResults));
          setPoemTotalNum(processedResults.length);
        } else {
          throw new Error('Received unexpected data structure from server');
        }
      } catch (error) {
        console.error('Search error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

// when query or handleSearch changed, trigger handleSearch()
  useEffect(() => {
    handleSearch(query);
  }, [query, handleSearch]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // handle when seaching bar goes back to empty status
    if (!newQuery.trim()) {
      setShowResults(false);
    }
  };

  // create arrays based on chapter
  const ChapterSelector = () => {
    const chapters = ['all', ...Object.keys(groupedResults).sort((a, b) => Number(a) - Number(b))];
    return (
      <div className={styles.chapterSelector}>
        {chapters.map((chapter) => (
          <button
            key={chapter}
            onClick={() => setSelectedChapter(chapter)}
            className={`${styles.chapterButton} ${selectedChapter === chapter ? styles.active : ''}`}
          >
            {chapter === 'all' ? 'All Chapters' : `${chapter} ${getChapterName_noJP(chapter)}`}
          </button>
        ))}
      </div>
    );
  };

  // count num of poem by chapter
  const countResult = () => {
    const num = selectedChapter === 'all' ? PoemTotalNum : (groupedResults[selectedChapter].length);
    return (
      <div className={styles.countResult}> 
        Appears in <strong>{num}</strong> {num === 1 ? 'poem' : 'poems'}
      </div>
      )
  }

  const renderResults = () => {
  
    const renderTranslation = (translation, translator) => {
      if (!translation) return <p>No translation available</p>;
      
      return translation.split('\n').map((line, index) => (
        <p key={`${translator}-line-${index}`}>
          {highlightMatch(line, query)}
        </p>
      ));
    };
  
    return (
      <ul className={styles.searchResults}>
        {resultsToRender.map((result, index) => (
          <li key={`${result.chapterNum}-${result.poemNum}-${index}`} className={styles.searchResultItem}>
            <Link href={`/poems/${result.chapterNum}/${result.poemNum}`}>
              <p className={styles.chapterPoemInfo}>
                {result.chapterNum} {getChapterName(result.chapterNum)} - Poem {result.poemNum}
              </p>
              <div className={styles.japaneseText}>
                {highlightMatch(result.japanese, query)}
              </div>
              <div className={styles.romajiText}>
                {highlightMatch(result.romaji, query)}  
              </div>
              <div className={styles.translation}>
                <h3 className={styles.translatorName}>Waley</h3>
                {renderTranslation(result.waley_translation, 'Waley')}
              </div>
              <div className={styles.translation}>
                <h3 className={styles.translatorName}>Seidensticker</h3>
                {renderTranslation(result.seidensticker_translation, 'Seidensticker')}
              </div>
              <div className={styles.translation}>
                <h3 className={styles.translatorName}>Tyler</h3>
                {renderTranslation(result.tyler_translation, 'Tyler')}
              </div>
              <div className={styles.translation}>
                <h3 className={styles.translatorName}>Washburn</h3>
                {renderTranslation(result.washburn_translation, 'Washburn')}
              </div>
              <div className={styles.translation}>
                <h3 className={styles.translatorName}>Cranston</h3>
                {renderTranslation(result.cranston_translation, 'Cranston')}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  };



  return (
    <div className={styles.poemSearch}>
      <input
        ref={searchInputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        placeholder="Enter keyword..."
        className={styles.searchInput}
      />
      {isLoading && <div className={styles.loadingMessage}>Searching...</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}
      {showResults && Object.keys(groupedResults).length > 0 && (
        <>
          <ChapterSelector />
          {countResult()}
          {renderResults()}
        </>
      )}
      {query && Object.keys(groupedResults).length === 0 && !isLoading && !error && (
        <div className={styles.noResultsMessage}>Not Found.</div>
      )}
      <BackTop className={styles.backTop}>
        <div>Back to top</div>
      </BackTop>
      </div>
  );
};

export default React.memo(PoemSearch);