'use client'
import React, { useState, useEffect } from 'react';
import styles from '../styles/pages/locationDisplay.module.css';
import FormatContent from './FormatText.prod';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const placeTypeColor = (type) => {
    if (type === 'fictional with evidence') return '#BFAE93';
    if (type === 'historical') return '#767D43';
    if (type === 'fictional without evidence') return '#EDB940';
    if (type === 'projected') return '#CC683D';
    return '#9c9c9c';
};

const RoleBadge = ({ role }) => {
    const labels = {
        composed: 'COMPOSED HERE',
        received: 'RECEIVED HERE',
        both: 'COMPOSED & RECEIVED HERE'
    };
    return (
        <span className={`${styles.roleBadge} ${styles[`role_${role}`]}`}>
            {labels[role] ?? role?.toUpperCase()}
        </span>
    );
};

const LocationChapterGraph = ({ poems }) => {
    const defaultChapterCounts = [
        9,14,2,19,25,14,17,8,24,33,4,48,30,17,6,3,9,16,10,13,16,14,6,14,8,4,2,4,9,8,21,11,20,24,18,11,8,6,26,12,26,1,4,24,13,21,31,15,24,11,22,11,28,1
    ].reduce((acc, count, index) => {
        acc[(index + 1).toString().padStart(2, '0')] = count;
        return acc;
    }, {});

    const labels = Object.keys(defaultChapterCounts).sort();

    const locationCounts = {};
    labels.forEach(ch => { locationCounts[ch] = 0; });

    poems.forEach(poem => {
        const ch = poem.chapter?.toString().padStart(2, '0');
        if (!ch || !labels.includes(ch)) return;
        locationCounts[ch]++;
    });

    const getBackgroundColor = (chapterNum) => {
        const originalCount = defaultChapterCounts[chapterNum] || 0;
        const locationCount = locationCounts[chapterNum] || 0;

        if (originalCount !== locationCount && originalCount !== 0 && locationCount !== 0) {
            return 'rgba(255, 255, 255, 0.5)';
        }

        return 'rgba(0, 0, 0, 0.7)';
    };

    const data = {
        labels,
        datasets: [
            {
                label: 'Total poems in chapter',
                data: labels.map(ch => defaultChapterCounts[ch] || 0),
                backgroundColor: labels.map(getBackgroundColor),
                barPercentage: 0.6,
                categoryPercentage: 0.8,
                order: 2,
            },
            {
                label: 'Poems at this location',
                data: labels.map(ch => locationCounts[ch]),
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                barPercentage: 0.6,
                categoryPercentage: 0.8,
                order: 1,
            },
        ],
    };

    const options = {
        maintainAspectRatio: false,
        scales: {
            x: { display: false, stacked: true, ticks: { display: false }, grid: { display: false } },
            y: { beginAtZero: true, stacked: false, ticks: { display: false }, grid: { display: false }, border: { display: false } },
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        if (ctx.datasetIndex === 0) return `Out of ${ctx.raw} poems in ch. ${ctx.label}`;
                        return `${ctx.raw} poems at this location`;
                    }
                }
            }
        },
    };

    return (
        <div className={styles.locationChartContainer}>
            <Bar data={data} options={options} />
        </div>
    );
};
const LocationDisplay = ({ locationData }) => {
    const { name } = locationData;

    const [state, setState] = useState({
        place: null,
        poems: [],
        characters: [],
        isLoading: true,
        error: null
    });

    const [expandedPanels, setExpandedPanels] = useState({
        description: true,
        characters: false,
        details: false
    });

    const togglePanel = (panel) => {
        setExpandedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    useEffect(() => {
        if (!name) return;

        const fetchLocationData = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));

                const cacheKey = `location_${name}`;
                const cacheTimeKey = `location_${name}_time`;
                const cached = localStorage.getItem(cacheKey);
                const cachedTime = localStorage.getItem(cacheTimeKey);
                const now = Date.now();
                const expirationTime = 3600000;

                if (cached && cachedTime && (now - parseInt(cachedTime, 10)) < expirationTime) {
                    setState(prev => ({ ...prev, ...JSON.parse(cached), isLoading: false }));
                    return;
                }

                if (cached) {
                    localStorage.removeItem(cacheKey);
                    localStorage.removeItem(cacheTimeKey);
                }

                const response = await fetch(`/api/spaces-location/location-page?params=${name}`);
                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

                const data = await response.json();
                // Expected shape:
                // {
                //   place: { name, type, description, region },
                //   poems: [{ poemId, chapter, number, speaker, addressee, season, japanese, translation, role }],
                //   characters: [{ name, role }]
                // }

                const newState = {
                    place: data.place ?? null,
                    poems: data.poems ?? [],
                    characters: data.characters ?? []
                };

                setState(prev => ({ ...prev, ...newState, isLoading: false }));

                try {
                    localStorage.setItem(cacheKey, JSON.stringify(newState));
                    localStorage.setItem(cacheTimeKey, now.toString());
                } catch (storageError) {
                    console.error('Cache storage failed:', storageError);
                }

            } catch (error) {
                console.error('Error fetching location data:', error);
                setState(prev => ({ ...prev, isLoading: false, error: error.message }));
            }
        };

        fetchLocationData();
    }, [name]);

    if (state.isLoading) {
        return <div className={styles.loadingContainer}>Loading location...</div>;
    }

    if (state.error || !state.place) {
        return <div className={styles.errorContainer}>Could not load location data.</div>;
    }

    const { place, poems, characters } = state;
    const typeColor = placeTypeColor(place.type);

    const composedPoems = poems.filter(p => p.role === 'composed' || p.role === 'both');
    const receivedPoems = poems.filter(p => p.role === 'received' || p.role === 'both');

    const hasDescription = !!place.description;
    const hasCharacters = characters.length > 0;
    const hasDetails = !!place.region || !!place.type;

    return (
        <div className={styles.locationPageContainer}>

            {/* ── HEADER SECTION ── */}
            <section className={styles.headerSection}>
                <img
                    className={styles.fullBackgroundImage}
                    src="/images/searchpage_background.png"
                    alt="Location Background"
                />
                <LocationChapterGraph poems={poems} />
                <div className={styles.headerContent}>
                    <div className={styles.locationNameBlock}>
                        <h1 className={styles.locationName}>{place.name}</h1>
                        {place.region && (
                            <span className={styles.regionLabel}>{place.region.toUpperCase()}</span>
                        )}
                    </div>

                    {/* Metadata grid — mirrors the poem page's info grid */}
                    <div className={styles.locationInfoGrid}>

                        <div className={`${styles.gridBox} ${styles.typeBox}`}>
                            <span
                                className={styles.typeIndicator}
                                style={{ backgroundColor: typeColor }}
                            />
                            <span className={styles.typeLabel}>TYPE</span>
                            <span className={styles.typeValue}>
                                {place.type ? place.type.toUpperCase() : '—'}
                            </span>
                        </div>

                        <div className={`${styles.gridBox} ${styles.poemCountBox}`}>
                            <span className={styles.poemCountVal}>{poems.length.toString().padStart(2, '0')}</span>
                            <span className={styles.poemCountLabel}>POEMS</span>
                        </div>

                        <div className={`${styles.gridBox} ${styles.composedCountBox}`}>
                            <span className={styles.composedCountVal}>
                                {composedPoems.length.toString().padStart(2, '0')}
                            </span>
                            <span className={styles.composedCountLabel}>COMPOSED HERE</span>
                        </div>

                        <div className={`${styles.gridBox} ${styles.receivedCountBox}`}>
                            <span className={styles.receivedCountVal}>
                                {receivedPoems.length.toString().padStart(2, '0')}
                            </span>
                            <span className={styles.receivedCountLabel}>RECEIVED HERE</span>
                        </div>

                        {hasCharacters && (
                            <div className={`${styles.gridBox} ${styles.characterCountBox}`}>
                                <span className={styles.characterCountVal}>
                                    {characters.length.toString().padStart(2, '0')}
                                </span>
                                <span className={styles.characterCountLabel}>CHARACTERS</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── BODY SECTION ── */}
            <section className={styles.bodySection}>
                <div className={styles.bodyContainer}>

                    {/* ── LEFT: ANALYSIS PANELS ── */}
                    <div className={styles.analysisLeft}>
                        <h2 className={styles.sectionHeader}>ABOUT THIS PLACE</h2>

                        {/* Description panel */}
                        <div className={styles.analysisPanel}>
                            <div
                                className={`${styles.panelHeader} ${!hasDescription ? styles.panelHeaderEmpty : ''}`}
                                onClick={() => togglePanel('description')}
                            >
                                <h2>DESCRIPTION</h2>
                                <div className={`${styles.toggleArrow} ${expandedPanels.description ? styles.arrowExpanded : styles.arrowCollapsed}`}>
                                    ▼
                                </div>
                            </div>
                            <div className={`${styles.panelContent} ${expandedPanels.description ? styles.expanded : styles.collapsed}`}>
                                {place.description
                                    ? <FormatContent content={place.description} />
                                    : <p className={styles.emptyNote}>No description yet.</p>
                                }
                            </div>
                        </div>

                        {/* Details panel */}
                        {hasDetails && (
                            <div className={styles.analysisPanel}>
                                <div
                                    className={styles.panelHeader}
                                    onClick={() => togglePanel('details')}
                                >
                                    <h2>MORE DETAILS</h2>
                                    <div className={`${styles.toggleArrow} ${expandedPanels.details ? styles.arrowExpanded : styles.arrowCollapsed}`}>
                                        ▼
                                    </div>
                                </div>
                                <div className={`${styles.panelContent} ${expandedPanels.details ? styles.expanded : styles.collapsed}`}>
                                    {place.region && (
                                        <div className={styles.detailItem}>
                                            <h3>REGION</h3>
                                            <p>{place.region}</p>
                                        </div>
                                    )}
                                    {place.type && (
                                        <div className={styles.detailItem}>
                                            <h3>CLASSIFICATION</h3>
                                            <p>{place.type}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Characters panel */}
                        {hasCharacters && (
                            <div className={styles.analysisPanel}>
                                <div
                                    className={styles.panelHeader}
                                    onClick={() => togglePanel('characters')}
                                >
                                    <h2>ASSOCIATED CHARACTERS</h2>
                                    <div className={`${styles.toggleArrow} ${expandedPanels.characters ? styles.arrowExpanded : styles.arrowCollapsed}`}>
                                        ▼
                                    </div>
                                </div>
                                <div className={`${styles.panelContent} ${expandedPanels.characters ? styles.expanded : styles.collapsed}`}>
                                    {characters.map((char, idx) => (
                                        <div key={idx} className={styles.characterItem}>
                                            <a
                                                href={`/characters/${encodeURIComponent(char.name)}`}
                                                className={styles.characterLink}
                                            >
                                                {char.name}
                                            </a>
                                            {char.role && (
                                                <span className={styles.characterRole}>
                                                    {char.role}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: POEMS LIST ── */}
                    <div className={styles.poemsRight}>
                        <h2 className={styles.sectionHeader}>POEMS AT THIS LOCATION</h2>
                        {poems.length === 0 ? (
                            <p className={styles.emptyNote}>No poems recorded at this location.</p>
                        ) : (
                            <div className={styles.poemsList}>
                                {poems.map((poem, idx) => {
                                    const chapterPadded = poem.chapter?.toString().padStart(2, '0');
                                    const numberPadded = poem.number?.toString().padStart(2, '0');

                                    return (
                                        <a
                                            key={idx}
                                            href={`/poems/${poem.chapter}/${poem.number}`}
                                            className={styles.poemCard}
                                        >
                                            <div className={styles.poemCardHeader}>
                                                <span className={styles.poemIdDisplay}>
                                                    {chapterPadded}·{numberPadded}
                                                </span>
                                                <RoleBadge role={poem.role} />
                                                {poem.season && (
                                                    <span className={styles.poemSeason}>
                                                        {poem.season === 'Spring' && '❀'}
                                                        {poem.season === 'Summer' && '☼'}
                                                        {poem.season === 'Autumn' && '✾'}
                                                        {poem.season === 'Winter' && '❋'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.poemCardMeta}>
                                                <span className={styles.poemSpeaker}>
                                                    {poem.speaker ?? '—'}
                                                </span>
                                                <span className={styles.poemArrow}>{'>>'}</span>
                                                <span className={styles.poemAddressee}>
                                                    {poem.addressee ?? '—'}
                                                </span>
                                            </div>

                                            {poem.japanese && (
                                                <p className={styles.poemJapanese}>{poem.japanese}</p>
                                            )}

                                            {poem.translation && (
                                                <p className={styles.poemTranslation}>{poem.translation}</p>
                                            )}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </section>
        </div>
    );
};

export default LocationDisplay;
