import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import Link from 'next/link';
import styles from '../styles/pages/filterSearch.module.css';
import { BackTop, Checkbox} from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PLURAL_TO_SING = {
  'Proffered Poems': 'Proffered Poem',
  'Reply Poems': 'Reply Poem',
  'Group Poems': 'Group Poem',
  'Soliloquies': 'Soliloquy',
};

const TAG_FIELD_BY_LABEL = {
  'Omitted By Waley': 'omitted_by_waley',
  'Omitted By Seidensticker': 'omitted_by_seidensticker',
  'Bad Poems': 'bad_poems',
  'Group Poem': 'group_poem_tag',
  'Character Name Poem': 'character_name_poem',
  'Chapter Title Poem': 'chapter_title_poem',
  'Morning After Poem': 'morning_after_poem',
  'Proxy Poem': 'proxy_poem',
};

// funtion to remove leading zero of chapternum and poemnum, ensure the correctness of link
const removeLeadingZero = (num) => {
  return num.replace(/^0+/, '');
};

const getChapterName = (String) => {
  const chapterNames = {
    '01': 'Kiritsubo 桐壺', '02': 'Hahakigi 帚木', '03': 'Utsusemi 空蝉', '04': 'Yūgao 夕顔', '05': 'Wakamurasaki 若紫', '06': 'Suetsumuhana 末摘花', '07': 'Momiji no Ga 紅葉賀', '08': 'Hana no En 花宴', '09': 'Aoi 葵', 
    '10': 'Sakaki 榊', '11': 'Hana Chiru Sato 花散里', '12': 'Suma 須磨', '13': 'Akashi 明石', '14': 'Miotsukushi 澪標', '15': 'Yomogiu 蓬生', '16': 'Sekiya 関屋', '17': 'E Awase 絵合', '18': 'Matsukaze 松風', 
    '19': 'Usugumo 薄雲', '20': 'Asagao 朝顔', '21': 'Otome 乙女', '22': 'Tamakazura 玉鬘', '23': 'Hatsune 初音', '24': 'Kochō 胡蝶', '25': 'Hotaru 螢', '26': 'Tokonatsu 常夏', '27': 'Kagaribi 篝火', 
    '28': 'Nowaki 野分', '29': 'Miyuki 行幸', '30': 'Fujibakama 藤袴', '31': 'Makibashira 真木柱', '32': 'Umegae 梅枝', '33': 'Fuji no Uraba 藤裏葉', '34': 'Wakana: Jō 若菜上', '35': 'Wakana: Ge 若菜下', 
    '36': 'Kashiwagi 柏木', '37': 'Yokobue 横笛', '38': 'Suzumushi 鈴虫', '39': 'Yūgiri 夕霧', '40': 'Minori 御法', '41': 'Maboroshi 幻', '42': 'Niou Miya 匂宮', '43': 'Kōbai 紅梅', '44': 'Takekawa 竹河', 
    '45': 'Hashihime 橋姫', '46': 'Shii ga Moto 椎本', '47': 'Agemaki 総角', '48': 'Sawarabi 早蕨', '49': 'Yadorigi 宿木', '50': 'Azumaya 東屋', '51': 'Ukifune 浮舟', '52': 'Kagerō 蜻蛉', '53': 'Tenarai 手習', 
    '54': 'Yume no Ukihashi 夢浮橋'
  };
  // Ensure chapterKey is a string and zero-padded (e.g., '1' -> '01')
  const formattedKey = String.toString().padStart(2, '0');

  return chapterNames[formattedKey] || "Unknown Chapter"; // Return default if not found
};

const getChapterNamRomanji = (String) => {
  const chapterNames = {
    '01': 'Kiritsubo', '02': 'Hahakigi', '03': 'Utsusemi', '04': 'Yūgao', '05': 'Wakamurasaki', '06': 'Suetsumuhana', '07': 'Momiji no Ga', '08': 'Hana no En', '09': 'Aoi',
    '10': 'Sakaki', '11': 'Hana Chiru Sato', '12': 'Suma', '13': 'Akashi', '14': 'Miotsukushi', '15': 'Yomogiu', '16': 'Sekiya', '17': 'E Awase', '18': 'Matsukaze',
    '19': 'Usugumo', '20': 'Asagao', '21': 'Otome', '22': 'Tamakazura', '23': 'Hatsune', '24': 'Kochō', '25': 'Hotaru', '26': 'Tokonatsu', '27': 'Kagaribi',
    '28': 'Nowaki', '29': 'Miyuki', '30': 'Fujibakama', '31': 'Makibashira', '32': 'Umegae', '33': 'Fuji no Uraba', '34': 'Wakana: Jō', '35': 'Wakana: Ge',
    '36': 'Kashiwagi', '37': 'Yokobue', '38': 'Suzumushi', '39': 'Yūgiri', '40': 'Minori', '41': 'Maboroshi', '42': 'Niou Miya', '43': 'Kōbai', '44': 'Takekawa',
    '45': 'Hashihime', '46': 'Shii ga Moto', '47': 'Agemaki', '48': 'Sawarabi', '49': 'Yadorigi', '50': 'Azumaya', '51': 'Ukifune', '52': 'Kagerō', '53': 'Tenarai',
    '54': 'Yume no Ukihashi'
  };
  // Ensure chapterKey is a string and zero-padded (e.g., '1' -> '01')
  const formattedKey = String.toString().padStart(2, '0');

  return chapterNames[formattedKey] || "Unknown Chapter";
};


const getChapterNamKanji = (String) => {
  const chapterNames = {
    '01': '桐壺', '02': '帚木', '03': '空蝉', '04': '夕顔', '05': '若紫', '06': '末摘花', '07': '紅葉賀', '08': '花宴', '09': '葵', 
    '10': '榊', '11': '花散里', '12': '須磨', '13': '明石', '14': '澪標', '15': '蓬生', '16': '関屋', '17': '絵合', '18': '松風', 
    '19': '薄雲', '20': '朝顔', '21': '乙女', '22': '玉鬘', '23': '初音', '24': '胡蝶', '25': '螢', '26': '常夏', '27': '篝火', 
    '28': '野分', '29': '行幸', '30': '藤袴', '31': '真木柱', '32': '梅枝', '33': '藤裏葉', '34': '若菜上', '35': '若菜下', 
    '36': '柏木', '37': '横笛', '38': '鈴虫', '39': '夕霧', '40': '御法', '41': '幻', '42': '匂宮', '43': '紅梅', '44': '竹河', 
    '45': '橋姫', '46': '椎本', '47': '総角', '48': '早蕨', '49': '宿木', '50': '東屋', '51': '浮舟', '52': '蜻蛉', '53': '手習', 
    '54': '夢浮橋'
  };  
  return chapterNames[String];
}

const PoemSearch = () => {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const searchInputRef = useRef(null);

  // State to manage search input for both speaker, addressee, and chapter
  const [searchSpeaker, setSearchSpeaker] = useState("");
  const [searchAddressee, setSearchAddressee] = useState("");
  const [searchChapter, setSearchChapter] = useState("");
  const [searchGenjiAge, setSearchGenjiAge] = useState('');
  const [searchOther, setSearchOther] = useState('');

  const ageOptions = {};
  for (let age = 1; age <= 75; age++) {
    ageOptions[age.toString()] = { label: `${age} years`, checked: false };
  }

  const [filters, setFilters] = useState({
    chapterNum: {
      label: "Chapter",
      options: {},
    },
    speaker_name: {
      label: "Poem From >>",
      options: {},
    },
    speaker_gender: {
      label: "Speaker Gender",
      options: {
        male: { checked: true },
        female: { checked: true },
        nonhuman: { checked: true },
      },
    },
    addressee_name: {
      label: ">> Poem To",
      options: {},
    },
    addressee_gender: {
      label: "Addressee Gender",
      options: {
        male: { checked: true },
        female: { checked: true },
        nonhuman: { checked: true },
      },
    },
    genji_age: {
      label: "Genji's Age",
      options: ageOptions,
    },
      // season: {
      //     label: 'Season',
      //     options: {
      //         'spring': { checked: false },
      //         'summer': { checked: false },
      //         'autumn': { checked: false },
      //         'winter': { checked: false }
      //     }
      // },
      poem_type: {
        label: "Poem Type",
        options: {
          'Proffered Poems' : {checked: false},
          'Reply Poems' : {checked: false},
          'Group Poems' : {checked: false},
          'Soliloquies' : {checked: false},
        },
      },

      other_tags: {
        label: "Other Tags",
        options: {
          'Omitted By Waley': { checked: false },
          'Omitted By Seidensticker': { checked: false },
          'Bad Poems': { checked: false },
          'Group Poem': { checked: false },
          'Character Name Poem': { checked: false },
          'Chapter Title Poem': { checked: false },
          'Morning After Poem': { checked: false },
          'Proxy Poem': { checked: false },
        },
      },
    //   poetic_tech: {
    //       label: 'Poetic Techniques Used',
    //       options: {
    //           'Kakekotoba': { checked: false },
    //           'Engo': { checked: false },
    //           'Makurakotoba': { checked: false },
    //           'Utamamakura': { checked: false }
    //       }
    //   },
    //   misc: {
    //     label: 'Misc',
    //     options: {
    //         'Special Poems': { checked: false },
    //         'Chapter Title Poems': { checked: false },
    //         'Character Name': { checked: false },
    //         'Has Commentary': { checked: false }
    //     }
    // }
  });

  // highlight matching keywords
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

  useEffect(() => {
    if (!results.length) return;
  
    const chapters = new Set();
    const addressees = new Set();
    const speakers = new Set();
    const speakerGenders = new Map();
    const addresseeGenders = new Map();
    const genjiAges = new Set();
  
    results.forEach((result) => {
      if (result.chapterNum) chapters.add(result.chapterNum);
      if (result.addressee_name) {
        addressees.add(result.addressee_name);
        addresseeGenders.set(result.addressee_name, result.addressee_gender);
      }
      if (result.speaker_name) {
        speakers.add(result.speaker_name);
        speakerGenders.set(result.speaker_name, result.speaker_gender);
      }
      // Add this to collect all unique ages
      if (result.genji_age && result.genji_age !== "") {
        genjiAges.add(result.genji_age);
      }
    });
  
    setFilters((prev) => ({
      ...prev,
      chapterNum: {
        ...prev.chapterNum,
        options: Array.from(chapters).reduce(
          (acc, chapter) => ({
            ...acc,
            [chapter]: { checked: false },
          }),
          {}
        ),
      },
      addressee_name: {
        ...prev.addressee_name,
        options: Array.from(addressees).reduce(
          (acc, name) => ({
            ...acc,
            [name]: { checked: false, gender: addresseeGenders.get(name) },
          }),
          {}
        ),
      },
      speaker_name: {
        ...prev.speaker_name,
        options: Array.from(speakers).reduce(
          (acc, name) => ({
            ...acc,
            [name]: { checked: false, gender: speakerGenders.get(name) },
          }),
          {}
        ),
      },
      genji_age: {
        ...prev.genji_age,
        label: "Genji's Age",
        options: Array.from(genjiAges).sort((a, b) => parseInt(a) - parseInt(b)).reduce(
          (acc, age) => ({
            ...acc,
            [age]: { checked: false, label: `${age} years` },
          }),
          {}
        ),
      },
    }));
  }, [results]);

  // keyword search
  const handleSearch = useCallback(
    debounce(async (searchQuery) => {
      setIsLoading(true);
      setError(null);

      // Check if query is empty and set default search to fetch all poems
      const queryToUse = searchQuery.trim() ? searchQuery : "=#=";

      try {
        console.log("Fetching from API with query:", queryToUse);

        // Construct query parameters
        const params = new URLSearchParams();
        params.append("q", queryToUse);

        // Add selected gender filters to the query parameters
        const selectedGenders = Object.entries(filters.speaker_gender.options)
          .filter(([_, { checked }]) => checked)
          .map(([gender]) => gender);

        if (selectedGenders.length > 0) {
          params.append("gender", selectedGenders.join(","));
        }

        // const response = await fetch(
        //   `/api/poems/poem_search?q=${encodeURIComponent(queryToUse)}`
        // );
        const response = await fetch(`/api/poems/poem_search?q=${encodeURIComponent(queryToUse)}`);
          // ? await fetch("/poems/default_poems.json")
          // : await fetch(`/api/poems/poem_search?q=${encodeURIComponent(queryToUse)}`);


        if (!response.ok) {
          throw new Error("Not found.");
        }

        const data = await response.json();
        console.log("API Response:", data);

        // If the query is =#=, set results to data otherwise process the data
        // if (queryToUse === "=#=") {
        //   setResults(data);
        //   setShowResults(true);
        //   return; // Early return if fetching all poems
        // }

        if (Array.isArray(data.searchResults)) {
          const processedResults = data.searchResults.map((result) => ({
            chapterNum: (
              Object.values(result.chapterNum).join("")
            ),
            poemNum: (Object.values(result.poemNum).join("")),
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
            season: Object.values(result.season).join(""),
            poem_type: 
              typeof result.poem_type === "string"
                ? result.poem_type.trim()
                : Object.values(result.poem_type || {}).join("").trim(),
            omitted_by_waley: !!result.omitted_by_waley,
            omitted_by_seidensticker: !!result.omitted_by_seidensticker,
            bad_poems: !!result.bad_poems,
            group_poem_tag: !!result.group_poem_tag,
            character_name_poem: !!result.character_name_poem,
            chapter_title_poem: !!result.chapter_title_poem,
            morning_after_poem: !!result.morning_after_poem,
            proxy_poem: !!result.proxy_poem,
            poetic_tech: Object.values(result.peotic_tech).join(""),
            genji_age: Object.values(result.genji_age).join(""),
            waley_translation: Object.values(result.waley_translation).join(""),
            seidensticker_translation: Object.values(
              result.seidensticker_translation
            ).join(""),
            tyler_translation: Object.values(result.tyler_translation).join(""),
            washburn_translation: Object.values(
              result.washburn_translation
            ).join(""),
            cranston_translation: Object.values(
              result.cranston_translation
            ).join(""),
          }));

          console.log("Setting results:", processedResults);
          setResults(processedResults);
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
    [setResults, setShowResults]
  );

  useEffect(() => {
    if (!query) {
      handleSearch(""); // Fetch all poems when no query is provided
    } else {
      handleSearch(query);
    }
  }, [query, handleSearch]);

  // filter gets checked
  const handleFilterChange = (category, optionKey) => {
    setFilters((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        options: {
          ...prev[category].options,
          [optionKey]: {
            ...prev[category].options[optionKey],
            checked: !prev[category].options[optionKey].checked,
          },
        },
      },
    }));
  };

  // filter logic
  const filteredResults = useMemo(() => {
    const activeFilters = Object.entries(filters).reduce(
      (acc, [category, { options }]) => {
        const activeOptions = Object.entries(options)
          .filter(([_, { checked }]) => checked)
          .map(([key]) => key);
        if (activeOptions.length) acc[category] = activeOptions;
        return acc;
      },
      {}
    );

    if (Object.keys(activeFilters).length === 0) return results;

    return results.filter((result) => {
      return Object.entries(activeFilters).every(
        ([category, activeOptions]) => {
          switch (category) {
            case "chapterNum":
              return activeOptions.includes(result.chapterNum);
            case "addressee_name":
              return activeOptions.includes(result.addressee_name);
            case "speaker_name":
              return activeOptions.includes(result.speaker_name);
            case "speaker_gender":
              return activeOptions.includes(result.speaker_gender);
            case "addressee_gender":

              // Enhanced addressee gender filtering (currently disabled)
              // This special handling was added to fix poems that were being filtered out:
              // - Poems with empty addressee_gender (like 12SM20, 21OT06) would always pass
              // - Poems with combined genders (like "male & female" from 53TN17) would match if any gender is active
              // Uncomment the code below if you need to include poems with missing or combined addressee genders:
              
              // if (!result.addressee_gender || result.addressee_gender.trim() === "") {
              //   return true; // Empty addressee gender passes all filters
              // }
              // if (result.addressee_gender.includes(" & ")) {
              //   const genders = result.addressee_gender.split(" & ").map(g => g.trim());
              //   return genders.some(gender => activeOptions.includes(gender));
              // }
              
              return activeOptions.includes(result.addressee_gender);
            // case "season":
            //   const val = (result.season || "").toString().toLowerCase();
            //   return activeOptions.map(s => s.toLowerCase()).includes(val);
            case "poetic_tech":
              return activeOptions.includes(result.poetic_tech);
            case "genji_age":
              return activeOptions.includes(result.genji_age);
            case "poem_type":
              const Singular = activeOptions.map(k => PLURAL_TO_SING[k] ?? k);
              return Singular.includes(result.poem_type);
            case "other_tags": {
              return activeOptions.every(label => {
                const field = TAG_FIELD_BY_LABEL[label];
                if (!field) return true;
                return !!result[field];
              });
            }
            default:
              return true;
          }
        }
      );
    });
  }, [filters, results]);

  const handleClearFilters = () => {
    // Reset filters to their default state (keeping gender options)
    const clearedFilters = Object.keys(filters).reduce((acc, filterKey) => {
      const clearedOptions = Object.entries(filters[filterKey].options).reduce((optAcc, [optionKey, option]) => {
        // Keep gender filters but set them to default values
        const shouldDefaultTrue = (filterKey === 'speaker_gender' || filterKey === 'addressee_gender') && 
                                 (optionKey === 'male' || optionKey === 'female' || optionKey === 'nonhuman');
        
        // Preserve the option but reset its checked status
        optAcc[optionKey] = {
          ...option, // Keep any other properties of the option
          checked: shouldDefaultTrue
        };
        return optAcc;
      }, {});
      
      acc[filterKey] = {
        ...filters[filterKey],
        options: clearedOptions
      };
      return acc;
    }, {});
    
    setFilters(clearedFilters);
    
    // Clear the keyword search input
    setQuery("");
    
    // Clear all search inputs
    setSearchSpeaker("");
    setSearchAddressee("");
    setSearchChapter("");
    setSearchGenjiAge(""); // Now this will work
    setSearchOther("");
    
    // Close all dropdown sections
    setOpenSections(new Set());
  }
  
  const defaultChapterCounts = [
    9, 14, 2, 19, 25, 14, 17, 8, 24, 33, 4, 48, 30, 17, 6, 3, 9, 16, 10, 13, 16, 14, 6, 14, 8, 4, 2, 4, 9, 8, 21, 11, 20, 24, 18, 11, 8, 6, 26, 12, 26, 1, 4, 24, 13, 21, 31, 15, 24, 11, 22, 11, 28, 1,
  ].reduce((acc, count, index) => {
    const chapterNum = (index + 1).toString().padStart(2, '0'); // '01', '02', ..., '54'
    acc[chapterNum] = count;
    return acc;
  }, {});


  const filteredChapterList = useMemo(() => {
    return Object.keys(defaultChapterCounts)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((chapterNum) => {
        const count = filteredResults.reduce((sum, poem) => {
          return poem.chapterNum === chapterNum ? sum + 1 : sum;
        }, 0);
        return { chapterNum, count };
      });
  }, [filteredResults]);


  const chapterData = useMemo(() => {
    // Start with the default counts for all chapters
    const originalCounts = { ...defaultChapterCounts };
  
    // Calculate the filtered counts
    const filteredCounts = Object.keys(defaultChapterCounts).reduce((acc, chapterNum) => {
      acc[chapterNum] = 0; // Initialize all chapters to 0
      return acc;
    }, {});
  
    filteredResults.forEach((poem) => {
      filteredCounts[poem.chapterNum] = (filteredCounts[poem.chapterNum] || 0) + 1;
    });
  
    const labels = Object.keys(defaultChapterCounts).sort((a, b) => a - b);
  
    // Determine the background color for the original bars (regular)
    const getBackgroundColor = (chapterNum) => {
      const originalCount = originalCounts[chapterNum] || 0;
      const filteredCount = filteredCounts[chapterNum] || 0;
  
      // If the counts are different and neither is zero, change the original bars to 50% white
      if (originalCount !== filteredCount && originalCount !== 0 && filteredCount !== 0) {
        return 'rgba(255, 255, 255, 0.5)'; // 50% white for original bars when they differ and neither count is zero
      } else {
        return 'rgba(0, 0, 0, 0.7)'; // Gray for original bars when they are the same or one of the counts is zero
      }
    };
  
    return {
      labels,
      datasets: [
        {
          label: 'Original Poems per Chapter',
          data: labels.map((label) => originalCounts[label] || 0),
          backgroundColor: labels.map(getBackgroundColor), // Apply dynamic backgroundColor
          barPercentage: 0.6, // Make the bars slightly narrower
          categoryPercentage: 0.8, // Adjust spacing between bars
          order: 2, // Render this dataset first
        },
        {
          label: 'Filtered Poems per Chapter',
          data: labels.map((label) => filteredCounts[label] || 0),
          backgroundColor: 'rgba(255, 255, 255, .9)', // White for filtered data
          barPercentage: 0.6, // Make the filtered bars slightly wider
          categoryPercentage: 0.8, // Ensure filtered bars fully cover original bars
          order: 1, // Render this dataset second (on top of original bars)
        },
      ],
    };
  }, [filteredResults]);
  
  const chartOptions = {
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false,
        stacked: true,
        ticks: {
          display: false,
        },
        grid: {
          display: false, // Removes vertical grid lines
        },
      },
      y: {
       beginAtZero: true,
        stacked: false,
        ticks: {
          display: false,
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const chapterNum = context.label;
            const chapterName = getChapterName(chapterNum);
            const poemsCount = context.raw;
  
            if (context.datasetIndex === 0) {
              return `Out of ${poemsCount} poems in ${chapterName}`;
            } else {
              return `${poemsCount} poems found`;
            }
          },
        },
        displayColors: true,
        usePointStyle: true,
      }
    },
  };  

  const [showByAge, setShowByAge] = useState(false);

  const defaultAgeCounts = [...Array(75)].reduce((acc, _, i) => {
    const age = (i + 1).toString(); // "1" to "75"
    acc[age] = 0;
    return acc;
  }, {});
  
  // Fill in your actual values
  const hardcodedCounts = {
    3: 7, 12: 2, 17: 35, 18: 42, 19: 16, 20: 8, 22: 22, 23: 15, 24: 16, 25: 8,
    26: 41, 27: 22, 28: 17, 29: 24, 31: 29, 32: 19, 33: 10, 34: 4, 35: 14,
    36: 42, 37: 22, 38: 12, 39: 33, 40: 14, 41: 9, 46: 6, 47: 11, 48: 11,
    49: 8, 50: 32, 51: 12, 52: 26, 61: 1, 62: 22, 63: 2, 67: 6, 70: 17,
    71: 48, 72: 32, 73: 16, 74: 55, 75: 7
  };
  
  // Merge actual counts into full 1–75 range
  Object.keys(hardcodedCounts).forEach((age) => {
    defaultAgeCounts[age] = hardcodedCounts[age];
  });  
  

  const ageData = useMemo(() => {
    const originalCounts = { ...defaultAgeCounts };
  
    // Create filtered counts
    const filteredCounts = Object.keys(defaultAgeCounts).reduce((acc, age) => {
      acc[age] = 0;
      return acc;
    }, {});
  
    filteredResults.forEach((poem) => {
      const age = poem.genji_age?.toString();
      if (filteredCounts.hasOwnProperty(age)) {
        filteredCounts[age] += 1;
      }
    });
  
    const labels = Object.keys(defaultAgeCounts);
  
    const getBackgroundColor = (age) => {
      const originalCount = originalCounts[age] || 0;
      const filteredCount = filteredCounts[age] || 0;
  
      if (originalCount !== filteredCount && originalCount !== 0 && filteredCount !== 0) {
        return 'rgba(255, 255, 255, 0.5)';
      } else {
        return 'rgba(0, 0, 0, 0.7)';
      }
    };
  
    return {
      labels,
      datasets: [
        {
          label: 'Original Poems per Age',
          data: labels.map((label) => originalCounts[label] || 0),
          backgroundColor: labels.map(getBackgroundColor), // Apply dynamic color
          barPercentage: 0.5,
          categoryPercentage: 1,
          order: 2,
        },
        {
          label: 'Filtered Poems per Age',
          data: labels.map((label) => filteredCounts[label] || 0),
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          barPercentage: 0.5,
          categoryPercentage: 1,
          order: 1,
        },
      ],
    };
  }, [results, filteredResults]);  
  
  // Chart options (to show x-axis and custom styling)
  const chartOptionsAge = {
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true, // Hide the x-axis
        stacked: true,
        ticks: {
          display: false,
        },
        grid: {
          display: false, // Remove vertical grid lines
        },
      },
      y: {
        beginAtZero: true,
        stacked: false,
        ticks: {
          display: false,
        },
        grid: {
          display: false, // Remove horizontal grid lines
        },
        border: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const ageNum = context.label;
            const poemsCount = context.raw;
            
            // For black bars (original poems)
            if (context.datasetIndex === 0) {
              return `Out of ${poemsCount} poems at age ${ageNum}`;
            }
            // For white bars (filtered poems)
            else {
              return `${poemsCount} poems found`;
            }
          },
        },
        displayColors: true,
        usePointStyle: true,
      }
    },
  };

  // useEffect(() => {
  //   handleSearch(query);
  // }, [query, handleSearch]);
  
  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!e.target.value.trim()) setShowResults(false);
  };
  
  // toggle control for chapter
  const [openSections, setOpenSections] = useState(new Set()); // Start with an empty Set to keep all sections closed
  
  const toggleSection = (category) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  // Auto-open sections when searching
  useEffect(() => {
    if (searchChapter.trim() !== '') {
      setOpenSections(prev => new Set([...prev, 'chapterNum']));
    }
  }, [searchChapter]);
  
  useEffect(() => {
    if (searchSpeaker.trim() !== '') {
      setOpenSections(prev => new Set([...prev, 'speaker_name']));
    }
  }, [searchSpeaker]);
  
  useEffect(() => {
    if (searchAddressee.trim() !== '') {
      setOpenSections(prev => new Set([...prev, 'addressee_name']));
    }
  }, [searchAddressee]);

  // Add this effect to auto-open Genji's Age section when searching
  useEffect(() => {
    if (searchGenjiAge.trim() !== '') {
      setOpenSections(prev => new Set([...prev, 'genji_age']));
    }
  }, [searchGenjiAge]);

  useEffect(() => {
    if (searchOther.trim() !== '') {
      setOpenSections(prev => new Set([...prev, 'other_filters']));
    }
  }, [searchOther]);


  const renderFilters = () => {
    //case-insensitive match for filters in Other Filters section
    const otherMatches = (title) =>
      (searchOther || '').length === 0 || title.toLowerCase().includes(searchOther);

    const selectedSpeakerGenders = Object.entries(
      filters.speaker_gender.options
    )
      .filter(([_, { checked }]) => checked)
      .map(([gender]) => gender);
  
    const selectedAddresseeGenders = Object.entries(
      filters.addressee_gender.options
    )
      .filter(([_, { checked }]) => checked)
      .map(([gender]) => gender);
  
    const filteredSpeakerOptions = Object.entries(
      filters.speaker_name.options
    ).filter(([name, { gender }]) => selectedSpeakerGenders.includes(gender));
  
    const filteredAddresseeOptions = Object.entries(
      filters.addressee_name.options
    ).filter(([name, { gender }]) => selectedAddresseeGenders.includes(gender));
  
    // Function to handle search input change for speaker names
    const handleSpeakerSearch = (e) => {
      setSearchSpeaker(e.target.value.toLowerCase());
    };
  
    // Function to handle search input change for addressee names
    const handleAddresseeSearch = (e) => {
      setSearchAddressee(e.target.value.toLowerCase());
    };
  
    // Function to handle search input change for chapters
    const handleChapterSearch = (e) => {
      setSearchChapter(e.target.value.toLowerCase());
    };
  
    // Function to filter names based on the search input
    const filterNames = (names, searchTerm) => {
      return names.filter((name) => name.toLowerCase().includes(searchTerm));
    };
  
    // Function to filter chapters based on the search input (by name or number)
    const filterChapters = (chapters, searchTerm) => {
      return chapters.filter((chapterKey) => {
        const chapterName = getChapterName(chapterKey).toLowerCase();
        return (
          chapterKey.includes(searchTerm) || chapterName.includes(searchTerm)
        );
      });
    };

    // Add this handler function for Genji's Age search
    const handleGenjiAgeSearch = (e) => {
      setSearchGenjiAge(e.target.value.toLowerCase());
    };
      
    return (
      <div className={styles.filterContainer}>
        <div className={styles.filterHeader}>
          <span className={styles.filterOnlyResultsLabel}>FILTERS</span>
          <button className={styles.clearFiltersButton} onClick={handleClearFilters}>
            CLEAR ALL
          </button>
        </div>
        
        {/* Keyword search at the top */}
        <div className={styles.searchArea}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowResults(true)}
            placeholder="POEM TEXT SEARCH"
            className={styles.keywordSearchInput}
          />
        </div>
        
        <div className={styles.filterScroll}>
          {/* Chapter Search Filter */}
          <div className={styles.filterSection}>
            <div
              className={styles.filterSectionHeader}
              onClick={() => toggleSection('chapterNum')}
            >
              <input
                type="text"
                placeholder="CHAPTER FILTER"
                value={searchChapter}
                onChange={handleChapterSearch}
                className={styles.searchInput}
                onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
              />
              <span
                className={`${styles.arrow} ${
                  openSections.has('chapterNum') ? styles.arrowDown : ""
                }`}
              >
                ▸
              </span>
            </div>
            <div
              className={`${styles.filterContent} ${
                openSections.has('chapterNum') ? styles.expanded : ""
              }`}
            >
              <div className={styles.chapterGrid}>
                {filterChapters(
                  Object.keys(filters.chapterNum.options),
                  searchChapter
                ).sort((a, b) => removeLeadingZero(a) - removeLeadingZero(b)).map((key, index) => (
                  <Checkbox
                    key={key}
                    checked={filters.chapterNum.options[key]?.checked}
                    onChange={() => handleFilterChange('chapterNum', key)}
                    className={styles.chapterOption}
                    style={{
                      marginLeft: index !== 0 ? "0px" : "0px",
                    }}
                  >
                    <div className={styles.chapterText}>
                      <span>{removeLeadingZero(key)}</span>
                      <span>{getChapterName(key)}</span>
                    </div>
                  </Checkbox>
                ))}
              </div>
            </div>
          </div>
    
          {/* Speaker Search Filter */}
          <div className={styles.filterSection}>
            <div
              className={styles.filterSectionHeader}
              onClick={() => toggleSection('speaker_name')}
            >
              <input
                type="text"
                placeholder="SPEAKER FILTER"
                value={searchSpeaker}
                onChange={handleSpeakerSearch}
                className={styles.searchInput}
                onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
              />
              <span
                className={`${styles.arrow} ${
                  openSections.has('speaker_name') ? styles.arrowDown : ""
                }`}
              >
                ▸
              </span>
            </div>
            <div
              className={`${styles.filterContent} ${
                openSections.has('speaker_name') ? styles.expanded : ""
              }`}
            >
              {/* Only show gender filters if search is empty */}
              {searchSpeaker.trim() === '' && (
                <>
                  <div
                    className={styles.speakerGenderFilters}
                    style={{
                      display: "flex",
                      gap: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    {Object.entries(
                      filters.speaker_gender.options
                    ).map(([gender, { checked }]) => (
                      <Checkbox
                        key={gender}
                        checked={checked}
                        onChange={() =>
                          handleFilterChange(
                            "speaker_gender",
                            gender
                          )
                        }
                        className={styles.speakerGenderCheckbox}
                      >
                        {gender.charAt(0).toUpperCase() +
                          gender.slice(1)}
                      </Checkbox>
                    ))}
                  </div>
                  <hr className={styles.divider} />
                </>
              )}
              
              {/* Filtered speaker names */}
              <div className={styles.filterCheckboxContainer}>
                {filterNames(
                  filteredSpeakerOptions.map(
                    ([key]) => key
                  ),
                  searchSpeaker
                ).map((key) => (
                  <Checkbox
                    key={key}
                    checked={
                      filters.speaker_name.options[key]
                        ?.checked
                    }
                    onChange={() =>
                      handleFilterChange(
                        "speaker_name",
                        key
                      )
                    }
                    className={`${styles.filterCheckbox} ${styles.alignLeft}`}
                    style={{ marginLeft: "0px" }}
                  >
                    {key}
                  </Checkbox>
                ))}
              </div>
            </div>
          </div>
    
          {/* Addressee Search Filter */}
          <div className={styles.filterSection}>
            <div
              className={styles.filterSectionHeader}
              onClick={() => toggleSection('addressee_name')}
            >
              <input
                type="text"
                placeholder="ADDRESSEE FILTER"
                value={searchAddressee}
                onChange={handleAddresseeSearch}
                className={styles.searchInput}
                onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
              />
              <span
                className={`${styles.arrow} ${
                  openSections.has('addressee_name') ? styles.arrowDown : ""
                }`}
              >
                ▸
              </span>
            </div>
            <div
              className={`${styles.filterContent} ${
                openSections.has('addressee_name') ? styles.expanded : ""
              }`}
            >
              {/* Only show gender filters if search is empty */}
              {searchAddressee.trim() === '' && (
                <>
                  <div
                    className={styles.addresseeGenderFilters}
                    style={{
                      display: "flex",
                      gap: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    {Object.entries(
                      filters.addressee_gender.options
                    ).map(([gender, { checked }]) => (
                      <Checkbox
                        key={gender}
                        checked={checked}
                        onChange={() =>
                          handleFilterChange(
                            "addressee_gender",
                            gender
                          )
                        }
                        className={styles.addresseeGenderCheckbox}
                      >
                        {gender.charAt(0).toUpperCase() +
                          gender.slice(1)}
                      </Checkbox>
                    ))}
                  </div>
                  <hr className={styles.divider} />
                </>
              )}
              
              {/* Filtered addressee names */}
              <div className={styles.filterCheckboxContainer}>
                {filterNames(
                  filteredAddresseeOptions.map(
                    ([key]) => key
                  ),
                  searchAddressee
                ).map((key) => (
                  <Checkbox
                    key={key}
                    checked={
                      filters.addressee_name.options[key]
                        ?.checked
                    }
                    onChange={() =>
                      handleFilterChange(
                        "addressee_name",
                        key
                      )
                    }
                    className={`${styles.filterCheckbox} ${styles.alignLeft}`}
                    style={{ marginLeft: "0px" }}
                  >
                    {key}
                  </Checkbox>
                ))}
              </div>
            </div>
          </div>
    
          {/* Genji's Age Search Filter */}
          <div className={styles.filterSection}>
            <div
              className={styles.filterSectionHeader}
              onClick={() => toggleSection('genji_age')}
            >
              <input
                type="text"
                placeholder="GENJI AGE FILTER"
                value={searchGenjiAge}
                onChange={handleGenjiAgeSearch}
                className={styles.searchInput}
                onClick={(e) => e.stopPropagation()} // Prevent triggering the parent onClick
              />
              <span
                className={`${styles.arrow} ${
                  openSections.has('genji_age') ? styles.arrowDown : ""
                }`}
              >
                ▸
              </span>
            </div>
            <div
              className={`${styles.filterContent} ${
                openSections.has('genji_age') ? styles.expanded : ""
              }`}
            >
              <div className={styles.filterOptions}>
                {Object.entries(filters.genji_age.options)
                  .filter(([age]) => age.toLowerCase().includes(searchGenjiAge.toLowerCase()))
                  .map(([age, { checked }], index) => (
                    <Checkbox
                      key={age}
                      checked={checked}
                      onChange={() => handleFilterChange('genji_age', age)}
                      className={`${styles.filterCheckbox} ${styles.alignLeft}`}
                      style={{ marginLeft: index !== 0 ? "0px" : "0px" }}
                    >
                      {age}
                    </Checkbox>
                  ))}
              </div>
            </div>
          </div>
    
          {/* Other Filter Sections */}
          <div className={styles.filterSection}>
            <div
              className={styles.filterSectionHeader}
              onClick={() => toggleSection('other_filters')}
            >
              <input
                type="text"
                placeholder="OTHER FILTERS"
                value={searchOther}
                onChange={(e) => setSearchOther(e.target.value.toLowerCase())}
                className={styles.searchInput}
                onClick={(e) => e.stopPropagation()}
              />
              <span
                className={`${styles.arrow} ${
                  openSections.has('other_filters') ? styles.arrowDown : ""
                }`}
              >
                ▸
              </span>
            </div>

            <div
              className={`${styles.filterContent} ${
                openSections.has('other_filters') ? styles.expanded : ""
              }`}
            >
            {/* hide season filter for now */}
              {/* Season */}
              
              {/* {otherMatches('Season') && (
                <>
                  <div className={styles.otherFilterTitles}>Season</div>
                  <div className={styles.filterOptions}>
                    {["spring", "summer", "autumn", "winter"].map((k) => (
                      <Checkbox
                        key={k}
                        checked={filters.season.options[k]?.checked}
                        onChange={() => handleFilterChange("season", k)}
                        className={`${styles.filterCheckbox} ${styles.alignLeft}`}
                      >
                        {k.charAt(0).toUpperCase() + k.slice(1)}
                      </Checkbox>
                    ))}
                  </div>
                </>
              )} */}

              {/* title divider between season and poem types */}
              {/* {(otherMatches('Season') && otherMatches('Poem Types')) && (
                <hr className={styles.divider} />
              )} */}

              {/* Poem Type */}
              {otherMatches('Poem Types') && (
                <>
                  <div className={styles.otherFilterTitles}>Poem Types</div>
                  <div className={styles.filterOptions}>
                    {Object.keys(filters.poem_type.options).map((k) => (
                      <Checkbox
                        key={k}
                        checked={filters.poem_type.options[k]?.checked}
                        onChange={() => handleFilterChange("poem_type", k)}
                        className={`${styles.filterCheckbox} ${styles.alignLeft}`}
                      >
                        {k}
                      </Checkbox>
                    ))}
                  </div>
                </>
              )}

              {(otherMatches('Poem Types') && otherMatches('Other Tags')) && (
                <hr className={styles.divider} />
              )}

              {/* Poem Type */}
              {otherMatches('Other Tags') && (
                <>
                  <div className={styles.otherFilterTitles}>Other Tags</div>
                  <div className={styles.filterOptions}>
                    {Object.keys(filters.other_tags.options).map((k) => (
                      <Checkbox
                        key={k}
                        checked={filters.other_tags.options[k]?.checked}
                        onChange={() => handleFilterChange("other_tags", k)}
                        className={`${styles.filterCheckbox} ${styles.alignLeft}`}
                      >
                        {k}
                      </Checkbox>
                    ))}
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSummary = (paraphrase, translator) => {
    if (!paraphrase) return <p>No Paraphrase Available</p>;
  
    return (
      <div className={styles.summaryTranslation}>
        {paraphrase.split("\n").map((line, index) => (
          <p
            key={`${translator}-line-${index}`}
            className={styles.summaryLine}
          >
            {highlightMatch(line, query)}
          </p>
        ))}
      </div>
    );
  };

  const renderTranslation = (translation, translator) => {
    if (!translation) return <p>No Translation Available</p>;
  
    return (
      <div className={styles.translation}>
        {translation.split("\n").map((line, index) => (
          <p
            key={`${translator}-line-${index}`}
            className={styles.translationLine}
          >
            {highlightMatch(line, query)}
          </p>
        ))}
      </div>
    );
  };

  
  const [hoveredItem, setHoveredItem] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = (index) => {
    // Clear any pending timeout to prevent flicker
    clearTimeout(hoverTimeoutRef.current);
    setHoveredItem(index);
  };
  
  const handleMouseLeave = () => {
    // Delay hiding to allow moving between tiles
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100);
  };

  const renderResults = () => (
    <div className={styles.searchResults}>
      {filteredResults.map((result, index) => (
        <div
          key={index}
          className={styles.resultItem}
          onMouseEnter={(event) => handleMouseEnter(index, event)}
          onMouseLeave={handleMouseLeave}
        >
          <Link href={`/poems/${removeLeadingZero(result.chapterNum)}/${removeLeadingZero(result.poemNum)}`}>
            <div className={styles.resultContent}>
              <h3
                className={styles.resultTitleSpeaker}
                style={{
                    color:
                    result.speaker_gender === 'male'
                        ? '#436875'
                        : result.speaker_gender === 'female'
                        ? '#B03F2E'
                        : 'inherit'
                }}
                >
                {result.speaker_name} &raquo;
              </h3>
              <div className={styles.resultWrapper}>
                <div className={styles.resultWrapperChapter}>
                  <div className={styles.resultTitle}>
                    {result.chapterNum}{result.chapterAbr}
                  </div>
                  <div className={styles.resultTitle}>
                    {result.poemNum}
                  </div>
                </div>
                <div className={styles.resultPoemKanji}>
                  {getChapterNamKanji(result.chapterNum)}
                </div>
              </div>
              <div>
                <div className={styles.japaneseText}>
                  {highlightMatch(result.japanese.split("\n")[0], query)}
                </div>
                <div className={styles.romajiText}>
                  {highlightMatch(result.romaji.split("\n")[0], query)}
                </div>
              </div>
              <h3 className={styles.resultTitleAddressee}
                  style={{
                      color:
                      result.addressee_gender === 'male'
                          ? '#436875'
                          : result.addressee_gender === 'female'
                          ? '#B03F2E'
                          : 'inherit'
                  }}
                  >
                  &raquo; {result.addressee_name}
              </h3>
            </div>
          </Link>
        </div>
      ))}

      {/* Hover Popup */}
      {hoveredItem !== null && (
        <div className={styles.hoverPopup}>
          <div className={styles.resulthoverContent}>
            <div className={styles.hoverTop}>
              <div className={styles.hoverTopFormattingLeft}>
                <div className={styles.hoverjapaneseText}>
                {highlightMatch(filteredResults[hoveredItem].japanese, query)}
                </div>
                <div className={styles.hoverromajiText}>
                  {highlightMatch(filteredResults[hoveredItem].romaji, query)}
                </div>
              </div>  
              <div className={styles.hoverTopFormattingRight}>
                <div className={styles.hoverChapPoemNumber}>
                  <div>
                    <h3 className={styles.hoverresultTitle}>
                    CHAPTER
                    </h3>
                    <h3 className={styles.hoverresultTitle}>
                    POEM
                    </h3>
                  </div>
                  <div>
                    <h3 className={styles.hoverresultTitle}>
                    {filteredResults[hoveredItem].chapterNum} 
                    </h3>
                    <h3 className={styles.hoverresultTitle}>
                    {filteredResults[hoveredItem].poemNum}
                    </h3>
                  </div>
                </div>
                <div className={styles.hoverresultTitleName}>
                  <div className={styles.chapterRomaji}>
                    {getChapterNamRomanji(filteredResults[hoveredItem].chapterNum)}
                  </div>
                  <div className={styles.chapterKanji}>
                    {getChapterNamKanji(filteredResults[hoveredItem].chapterNum).split('').map((char, index) => (
                      <div key={index}>{char}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.resulthoverSubTitle}>
              <span
                style={{
                  color:
                    filteredResults[hoveredItem].speaker_gender === 'male'
                      ? '#436875'
                      : filteredResults[hoveredItem].speaker_gender === 'female'
                      ? '#B03F2E'
                      : 'inherit',
                }}
              >
                {filteredResults[hoveredItem].speaker_name} &raquo;
              </span>
              <span
                style={{
                  color:
                    filteredResults[hoveredItem].addressee_gender === 'male'
                      ? '#436875'
                      : filteredResults[hoveredItem].addressee_gender === 'female'
                      ? '#B03F2E'
                      : 'inherit',
                }}
              >
                &raquo; {filteredResults[hoveredItem].addressee_name}
              </span>
            </div>
            <div className={styles.hoverBottom}>
              {/* WALEY */}
              <div className={styles.translation}>
                {renderTranslation(filteredResults[hoveredItem].waley_translation, "Waley")}

                <div className={styles.translationMeta}>
                  <div className={styles.metaNames}>
                    <span>{filteredResults[hoveredItem].speaker_name} &raquo;</span>
                    <span>&raquo; {filteredResults[hoveredItem].addressee_name}</span>
                  </div>
                </div>
                <div className={styles.translationMetaMid}>
                  <div className={styles.metaChapter}>
                    <span>{filteredResults[hoveredItem].chapterNum}{filteredResults[hoveredItem].chapterAbr}</span>
                    <span>{filteredResults[hoveredItem].poemNum}</span>
                  </div>
                  <div className={styles.metaRomaji}>
                    {getChapterNamKanji(filteredResults[hoveredItem].chapterNum)}
                  </div>
                </div>
                <h3 className={styles.translatorName}>WALEY</h3>
              </div>

              {/* WASHBURN */}
              <div className={styles.translation}>
                {renderTranslation(filteredResults[hoveredItem].washburn_translation, "Washburn")}

                <div className={styles.translationMeta}>
                  <div className={styles.metaNames}>
                    <span>{filteredResults[hoveredItem].speaker_name} &raquo;</span>
                    <span>&raquo; {filteredResults[hoveredItem].addressee_name}</span>
                  </div>
                </div>
                <div className={styles.translationMetaMid}>
                  <div className={styles.metaChapter}>
                    <span>{filteredResults[hoveredItem].chapterNum}{filteredResults[hoveredItem].chapterAbr}</span>
                    <span>{filteredResults[hoveredItem].poemNum}</span>
                  </div>
                  <div className={styles.metaRomaji}>
                    {getChapterNamKanji(filteredResults[hoveredItem].chapterNum)}
                  </div>
                </div>
                <h3 className={styles.translatorName}>WASHBURN</h3>
              </div>

              {/* SEIDENSTICKER */}
              <div className={styles.translation}>
                {renderTranslation(filteredResults[hoveredItem].seidensticker_translation, "Seidensticker")}

                <div className={styles.translationMeta}>
                  <div className={styles.metaNames}>
                    <span>{filteredResults[hoveredItem].speaker_name} &raquo;</span>
                    <span>&raquo; {filteredResults[hoveredItem].addressee_name}</span>
                  </div>
                </div>
                <div className={styles.translationMetaMid}>
                  <div className={styles.metaChapter}>
                    <span>{filteredResults[hoveredItem].chapterNum}{filteredResults[hoveredItem].chapterAbr}</span>
                    <span>{filteredResults[hoveredItem].poemNum}</span>
                  </div>
                  <div className={styles.metaRomaji}>
                    {getChapterNamKanji(filteredResults[hoveredItem].chapterNum)}
                  </div>
                </div>
                <h3 className={styles.translatorName}>SEIDENSTICKER</h3>
              </div>

              {/* CRANSTON */}
              <div className={styles.translation}>
                {renderTranslation(filteredResults[hoveredItem].cranston_translation, "Cranston")}

                <div className={styles.translationMeta}>
                  <div className={styles.metaNames}>
                    <span>{filteredResults[hoveredItem].speaker_name} &raquo;</span>
                    <span>&raquo; {filteredResults[hoveredItem].addressee_name}</span>
                  </div>
                </div>
                <div className={styles.translationMetaMid}>
                  <div className={styles.metaChapter}>
                    <span>{filteredResults[hoveredItem].chapterNum}{filteredResults[hoveredItem].chapterAbr}</span>
                    <span>{filteredResults[hoveredItem].poemNum}</span>
                  </div>
                  <div className={styles.metaRomaji}>
                    {getChapterNamKanji(filteredResults[hoveredItem].chapterNum)}
                  </div>
                </div>
                <h3 className={styles.translatorName}>CRANSTON</h3>
              </div>

              {/* TYLER */}
              <div className={styles.translation}>
                {renderTranslation(filteredResults[hoveredItem].tyler_translation, "Tyler")}

                <div className={styles.translationMeta}>
                  <div className={styles.metaNames}>
                    <span>{filteredResults[hoveredItem].speaker_name} &raquo;</span>
                    <span>&raquo; {filteredResults[hoveredItem].addressee_name}</span>
                  </div>
                </div>
                <div className={styles.translationMetaMid}>
                  <div className={styles.metaChapter}>
                    <span>{filteredResults[hoveredItem].chapterNum}{filteredResults[hoveredItem].chapterAbr}</span>
                    <span>{filteredResults[hoveredItem].poemNum}</span>
                  </div>
                  <div className={styles.metaRomaji}>
                    {getChapterNamKanji(filteredResults[hoveredItem].chapterNum)}
                  </div>
                </div>
                <h3 className={styles.translatorName}>TYLER</h3>
              </div>

              {/* SUMMARY */}
              <div className={styles.summaryTranslation}>
                <h3 className={styles.summaryName}>PARAPHRASE</h3>
                {/* add paraphrase data as summary */}
                {renderSummary(filteredResults[hoveredItem].paraphrase, "Paraphrase")}
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.poemSearch}>
      <img 
        className={styles.fullBackgroundImage} 
        src={showByAge 
          ? "/images/searchpage_background2.png" 
          : "/images/searchpage_background.png"} 
        alt="Genji background" 
      />
      <div
        className={styles.chartContainer}
        style={{
          top: showByAge ? '33px' : '98px',
          left: showByAge ? '54.4%' : '53.7%',
          width: showByAge ? '1230px' : '1253px',
          height: showByAge ? '413px' : '340px',
        }}
      >
        <Bar
          data={showByAge ? ageData : chapterData}
          options={showByAge ? chartOptionsAge : chartOptions}
        />
      </div>

      {!showByAge && (
        <div className={styles.chapterCountBar}>
          {filteredChapterList.map(({ chapterNum, count }) => (
            <div key={chapterNum} className={styles.chapterCell}>
              {count > 0 ? count.toString().padStart(2, '0') : ''}
            </div>
          ))}
        </div>
      )}
      
      <div className={styles.mainContent}>
        <aside className={styles.filterSidebar}>{renderFilters()}</aside>

        <main className={styles.resultsArea}>
          <span className={styles.filterResultsLabel}>RESULTS</span>
          {isLoading && <div className={styles.loading}>Searching...</div>}
          {error && <div className={styles.error}>{error}</div>}

          {showResults && results.length > 0 && (
            <>
              <div className={styles.resultCount}>
                <div className={styles.resultCountNumber}>
                  {filteredResults.length.toString().padStart(3, '0')}
                </div>
                <div className={styles.resultCountText}>
                  <span>POEMS</span>
                  <span>FOUND</span>
                </div>
                <div className={styles.buttonContainer}>
                  <button
                    className={`${styles.toggleButton} ${
                      showByAge ? styles.inactive : styles.active
                    }`}
                    onClick={() => setShowByAge(false)}
                  >
                    graph by <strong>chapter</strong>
                  </button>
                  <button
                    className={`${styles.toggleButton} ${
                      showByAge ? styles.active : styles.inactive
                    }`}
                    onClick={() => setShowByAge(true)}
                  >
                    graph by <strong>Genji&apos;s age</strong>
                  </button>
                </div>
                {Object.values(filters).some(({ options }) =>
                  Object.values(options).some(({ checked }) => checked)
                ) && (
                  <div className={styles.filterIndicator}></div>
                )}
              </div>
              {renderResults()}
            </>
          )}

          {query && results.length === 0 && !isLoading && !error && (
            <div className={styles.noResults}>No results found</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default React.memo(PoemSearch);
