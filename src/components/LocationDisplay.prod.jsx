'use client'
import React, { useState, useEffect } from 'react';
import styles from '../styles/pages/locationDisplay.module.css';
import FormatContent from './FormatText.prod';
import '../styles/pages/locationMap.css';
import { useAuth } from '../hooks/useAuth';
import { Bar } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);


const placeTypeColor = (type) => {
    if (type === 'fictional with evidence') return '#BFAE93';
    if (type === 'historical') return '#767D43';
    if (type === 'fictional without evidence') return '#EDB940';
    if (type === 'projected') return '#CC683D';
    return '#9c9c9c';
};

export function BackButton() {
    const router = useRouter();
    return (
        <button className={styles.backButton} onClick={() => router.push('/poem-map')}>
            ← Back to Map
        </button>
    );
}

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
            x: { display: false, stacked: true, ticks: { display: false }, grid: { display: false }, border: { display: false }},
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
    const { isAdmin } = useAuth();
    const { name } = locationData;

    const [state, setState] = useState({
        place: null,
        poems: [],
        claims: [],
        isLoading: true,
        error: null
    });
    const handleClaimVerifyToggle = async (claimId, currentlyVerified) => {
        const nextVerified = !currentlyVerified;

        setState(prev => ({
            ...prev,
            claims: prev.claims.map(c => c.id === claimId ? { ...c, verified: nextVerified } : c)
        }));

        try {
            const res = await fetch(`/api/neo4j_driver/claims/${claimId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: nextVerified }),
            });
            if (!res.ok) throw new Error('Update failed');
        } catch (err) {
            setState(prev => ({
                ...prev,
                claims: prev.claims.map(c => c.id === claimId ? { ...c, verified: currentlyVerified } : c)
            }));
            console.error(err);
        }
    };

    const handleDescriptionVerifyToggle = async (placeName, currentlyVerified) => {
        const nextVerified = !currentlyVerified;

        setState(prev => ({
            ...prev,
            place: { ...prev.place, descriptionVerified: nextVerified }
        }));

        try {
            const res = await fetch(`/api/neo4j_driver/place/${encodeURIComponent(placeName)}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: nextVerified }),
            });
            if (!res.ok) throw new Error('Update failed');
        } catch (err) {
            setState(prev => ({
                ...prev,
                place: { ...prev.place, descriptionVerified: currentlyVerified }
            }));
            console.error(err);
        }
    };

    const [expandedPanels, setExpandedPanels] = useState({
        description: true,
        claims: true,
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
                const newState = {
                    place: data.place ?? null,
                    poems: data.poems ?? [],
                    claims: data.claims ?? [],
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

    const { place, poems, claims } = state;
    const chapterLabels = Array.from({ length: 54 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const locationChapterCounts = chapterLabels.reduce((acc, ch) => {
        acc[ch] = 0;
        return acc;
    }, {});

    poems.forEach(poem => {
        const ch = poem.chapter?.toString().padStart(2, '0');
        if (ch && locationChapterCounts.hasOwnProperty(ch)) {
            locationChapterCounts[ch]++;
        }
    });
    const typeColor = placeTypeColor(place.type);

    const composedPoems = poems.filter(p => p.role === 'composed' || p.role === 'both');
    const receivedPoems = poems.filter(p => p.role === 'received' || p.role === 'both');

    const hasDescription = !!place.description;
    const hasClaims = claims.length > 0;
    const hasDetails = !!place.type;

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

                <div className={styles.chapterCountBar}>
                    {chapterLabels.map((ch) => (
                        <div key={ch} className={styles.chapterCell}>
                            {locationChapterCounts[ch] > 0 ? locationChapterCounts[ch].toString().padStart(2, '0') : ''}
                        </div>
                    ))}
                </div>
                <div className={styles.headerContent}>
                    <div className={styles.locationNameBlock}>
                        {BackButton()}
                        <h1 className={styles.locationName}>{place.name}</h1>
                    </div>

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

                        {hasClaims && (
                            <div className={`${styles.gridBox} ${styles.claimCountBox}`}>
                                <span className={styles.claimCountVal}>
                                    {claims.length.toString().padStart(2, '0')}
                                </span>
                                <span className={styles.claimCountLabel}>CLAIMS</span>
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
                                <div style={{display: 'flex', flexDirection: 'row', margin: '20px 0 0 0', justifyContent: 'flex-end', gap: '12px'}}>
                                    <span>{place.descriptionVerified ? 'AI Generated, Human Verified' : 'AI Generated'}</span>
                                    {isAdmin && (
                                        <button
                                            role="switch"
                                            aria-checked={place.descriptionVerified === true}
                                            className={`toggle-switch ${place.descriptionVerified === true ? 'on' : ''}`}
                                            onClick={() => {
                                                console.log('clicked description:', place);
                                                handleDescriptionVerifyToggle(place.name, place.descriptionVerified);
                                            }}
                                            >
                                            <span className="toggle-thumb"></span>
                                        </button>
                                    )}
                                </div>

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
                                    {place.type && (
                                        <div className={styles.detailItem}>
                                            <h3>CLASSIFICATION</h3>
                                            <p>{place.type}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Claims panel */}
                        {hasClaims && (
                            <div className={styles.analysisPanel}>
                                <div
                                    className={styles.panelHeader}  
                                    onClick={() => togglePanel('claims')}
                                >
                                    <h2>ASSOCIATED CLAIMS</h2>
                                    <div className={`${styles.toggleArrow} ${expandedPanels.claims ? styles.arrowExpanded : styles.arrowCollapsed}`}>
                                        ▼
                                    </div>
                                </div>
                                <div className={`${styles.panelContent} ${expandedPanels.claims ? styles.expanded : styles.collapsed}`}>
                                    {claims.map((claim, idx) => (
                                        <div key={claim.id ?? idx} className={styles.claimItem}>
                                            <div className={styles.chapPageToggle}>
                                                <span className={styles.claimChapPage}>
                                                    {`CHAPTER ${claim.chapter},  PAGE ${claim.page}`}
                                                </span>
                                                <span>{claim.verified ? 'AI Generated, Human Verified' : 'AI Generated'}</span>
                                                {isAdmin && (
                                                    <button
                                                        role="switch"
                                                        aria-checked={claim.verified === true}
                                                        className={`toggle-switch ${claim.verified === true ? 'on' : ''}`}
                                                        onClick={() => {
                                                            console.log('clicked claim:', claim.id, claim);
                                                            handleClaimVerifyToggle(claim.id, claim.verified);
                                                        }}
                                                        >
                                                        <span className="toggle-thumb"></span>
                                                    </button>
                                                )}
                                            </div>
                                            <span className={styles.claimQuote}>
                                                {claim.quote ?? 'Untitled claim'}
                                            </span>
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
