'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import LocationMap from '../../components/LocationMap.prod.jsx';
import ChapterDropdown from '../../components/ChapterDropdown.prod.jsx';
import LocationDropdown from '../../components/LocationDropdown.prod.jsx';
import SpeakerDropdown from '../../components/SpeakerDropdown.prod.jsx';
import AddresseeDropdown from '../../components/AddresseeDropdown.prod.jsx';
import TranslatorDropdown from '../../components/TranslatorDropdown.prod.jsx';
import styles from '../../styles/pages/chapterProfile.module.css';

function useStoredArray(key) {
    const [value, setValue] = useState([]);
    const isFirstRun = useRef(true);

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(key);
            if (saved) setValue(JSON.parse(saved));
        } catch {
            // ignore
        }
    }, [key]);

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return; // skip writing on mount — value here is still the pre-hydration []
        }
        sessionStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}

function useDebouncedValue(value, delay) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

export default function MapPage() {
    const [allPlaces, setAllPlaces] = useState(null);  // deduped place metadata, keyed by name
    const [allPoems, setAllPoems] = useState(null);     // flat array of every poem across all chapters
    const [isLoading, setIsLoading] = useState(true);

    const [selectedChapters, setSelectedChapters] = useStoredArray('chapters_selected');
    const [selectedLocations, setSelectedLocations] = useStoredArray('locations_selected');
    const [selectedSpeakers, setSelectedSpeakers] = useStoredArray('speakers_selected');
    const [selectedAddressees, setSelectedAddressees] = useStoredArray('addressees_selected');
    const [selectedTranslator, setSelectedTranslator] = useState('washburn');
    const [keyword, setKeyword] = useState('');
    const debouncedKeyword = useDebouncedValue(keyword, 300);

    const anyFilterActive =
    selectedChapters.length > 0 ||
    selectedLocations.length > 0 ||
    selectedSpeakers.length > 0 ||
    selectedAddressees.length > 0 ||
    debouncedKeyword.trim().length > 0;

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/spaces-location/translators')
            .then(r => r.json())
            .then(data => {
                const placesByName = new Map();
                const poems = [];

                (data.places || []).forEach(place => {
                    if (place.name && !placesByName.has(place.name)) {
                        placesByName.set(place.name, place);
                    }
                });

                Object.values(data.poems || {}).forEach(poem => {
                    poems.push({
                        ...poem,
                        speaker_name: poem.composition?.speaker || "",
                        addressee_name: poem.receipt?.addressee || "",
                    });
                });

                setAllPlaces(placesByName);
                setAllPoems(poems);
            })
            .catch(err => console.error('Failed to load poems:', err))
            .finally(() => setIsLoading(false));
    }, []);

    const matchesChapter = (poem) =>
        selectedChapters.length === 0 || selectedChapters.includes(poem.chapterNum);

    const matchesLocation = (poem) =>
        selectedLocations.length === 0 ||
        selectedLocations.includes(poem.composition?.placeName) ||
        selectedLocations.includes(poem.receipt?.placeName);

    const matchesSpeaker = (poem) =>
        selectedSpeakers.length === 0 || selectedSpeakers.includes(poem.speaker_name);

    const matchesAddressee = (poem) =>
        selectedAddressees.length === 0 || selectedAddressees.includes(poem.addressee_name);

    const matchesKeyword = (poem) => {
        if (!debouncedKeyword.trim()) return true;
        const k = debouncedKeyword.toLowerCase();
        const text = (poem.composition?.[selectedTranslator] || poem.receipt?.[selectedTranslator] || '').toLowerCase();
        return text.includes(k);
    };

    const handleClearAllFilters = () => {
        setSelectedChapters([]);
        setSelectedLocations([]);
        setSelectedSpeakers([]);
        setSelectedAddressees([]);
        setKeyword('');
    };
    // --- allowed sets per dropdown: every filter EXCEPT that dropdown's own ---
    const allowedChapters = useMemo(() => {
        if (!allPoems) return null;
        if (!anyFilterActive) return null; // nothing picked anywhere -> dim all
        const set = new Set();
        allPoems.forEach(p => {
            if (matchesLocation(p) && matchesSpeaker(p) && matchesAddressee(p) && matchesKeyword(p)) {
                set.add(p.chapterNum);
            }
        });
        return set;
    }, [allPoems, anyFilterActive, selectedLocations, selectedSpeakers, selectedAddressees, debouncedKeyword]);

    const allowedLocations = useMemo(() => {
        if (!allPoems) return null;
        if (!anyFilterActive) return null; // nothing picked anywhere -> dim all
        const set = new Set();
        allPoems.forEach(p => {
            if (matchesChapter(p) && matchesSpeaker(p) && matchesAddressee(p) && matchesKeyword(p)) {
                if (p.composition?.placeName) set.add(p.composition.placeName);
                if (p.receipt?.placeName) set.add(p.receipt.placeName);
            }
        });
        return set;
    }, [allPoems, selectedChapters, selectedSpeakers, selectedAddressees, debouncedKeyword]);

    const allowedSpeakers = useMemo(() => {
        if (!allPoems) return null;
        if (!anyFilterActive) return null; // nothing picked anywhere -> dim all
        const set = new Set();
        allPoems.forEach(p => {
            if (matchesChapter(p) && matchesLocation(p) && matchesAddressee(p) && matchesKeyword(p)) {
                if (p.speaker_name) set.add(p.speaker_name);
            }
        });
        return set;
    }, [allPoems, selectedChapters, selectedLocations, selectedAddressees, debouncedKeyword]);

    const allowedAddressees = useMemo(() => {
        if (!allPoems) return null;
        if (!anyFilterActive) return null; // nothing picked anywhere -> dim all
        const set = new Set();
        allPoems.forEach(p => {
            if (matchesChapter(p) && matchesLocation(p) && matchesSpeaker(p) && matchesKeyword(p)) {
                if (p.addressee_name) set.add(p.addressee_name);
            }
        });
        return set;
    }, [allPoems, selectedChapters, selectedLocations, selectedSpeakers, debouncedKeyword]);

    // --- shape into places / dimPlaces / poems / dimPoems, using the merged
    // place metadata (type, description, lat, lng) rather than reconstructing
    // it from each poem's composition/receipt object ---
    const mapData = useMemo(() => {
        if (!allPoems || !allPlaces || allPoems.length === 0) return null;

        const merged = { places: [], dimPlaces: [], poems: {}, dimPoems: {} };
        const seenPlaces = new Set();
        const seenDimPlaces = new Set();

        allPoems.forEach(poem => {
            const passes = anyFilterActive && matchesChapter(poem) && matchesLocation(poem) &&
                            matchesSpeaker(poem) && matchesAddressee(poem) && matchesKeyword(poem);
            const target = passes ? merged.poems : merged.dimPoems;

            target[poem.pnum] = poem;

            [poem.composition?.placeName, poem.receipt?.placeName].forEach(name => {
                if (!name) return;
                const placeMeta = allPlaces.get(name);
                if (!placeMeta) return;

                if (passes) {
                    if (!seenPlaces.has(name)) {
                        seenPlaces.add(name);
                        merged.places.push(placeMeta);
                    }
                    if (seenDimPlaces.has(name)) {
                        seenDimPlaces.delete(name);
                        merged.dimPlaces = merged.dimPlaces.filter(p => p.name !== name);
                    }
                } else if (!seenPlaces.has(name) && !seenDimPlaces.has(name)) {
                    seenDimPlaces.add(name);
                    merged.dimPlaces.push(placeMeta);
                }
            });
        });

        return merged;
    }, [allPoems, allPlaces, selectedChapters, selectedLocations, selectedSpeakers, selectedAddressees, debouncedKeyword, selectedTranslator]);

    const legendItems = [
        {color: '#CC683D', label: 'PROJECTED'},
        {color: '#BFAE93', label: 'FICTIONAL WITH CITATION'},
        {color: '#767D43', label: 'HISTORICAL'},
        {color: '#EDB940', label: 'FICTIONAL WITHOUT CITATION'}
    ];

    return (
        <div style={{ display: 'flex', gap: '10px', padding: '20px', height: '81vh' }}>
            <div className={styles.lgScrollableList} >
                <aside style={{ width: '350px', flexShrink: 0 }}>
                        <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                            <div className={styles.characterButton} style={{pointerEvents: 'none'}}>
                                Poems Found: {mapData ? Object.keys(mapData.poems).length : 0}
                            </div>
                            <div className={styles.characterButton} style={{pointerEvents: 'none'}}>
                                Places Found: {mapData ? mapData.places.length : 0}
                            </div>
                        </div>
                        <button 
                            className={styles.characterButton}
                            style={{
                                width: '100%'
                            }}
                            onClick={handleClearAllFilters}
                        >
                            Clear all filters
                        </button>
                        <ChapterDropdown
                            value={selectedChapters}
                            onChange={setSelectedChapters}
                            allowedKeys={allowedChapters}
                        />
                        <LocationDropdown
                            value={selectedLocations}
                            onChange={setSelectedLocations}
                            allowedKeys={allowedLocations}
                        />
                        <SpeakerDropdown
                            value={selectedSpeakers}
                            onChange={setSelectedSpeakers}
                            allowedKeys={allowedSpeakers}
                            allPoems={allPoems || []}
                        />
                        <AddresseeDropdown
                            value={selectedAddressees}
                            onChange={setSelectedAddressees}
                            allowedKeys={allowedAddressees}
                            allPoems={allPoems || []}
                        />
                        <TranslatorDropdown
                            value={selectedTranslator}
                            onChange={setSelectedTranslator}
                        />
                        <div className={styles.panelHeader}>
                            <input
                                type="text"
                                className={styles.panelHeaderSearch}
                                placeholder="Search poem text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />
                        </div>
                        <div>
                            {legendItems.map((item, idx) => (
                                <div key={idx} className="legend-item">
                                    <div className="legend-color" style={{ background: item.color }}></div>
                                    <p className="legend-text">{item.label}</p>
                                </div>
                            ))}
                        </div>
                </aside>
            </div>

            {isLoading ? (
                <div>Loading...</div>
            ) : mapData ? (
                <LocationMap
                    initialData={mapData}
                    selectedTranslator={selectedTranslator}
                    />
            ) : (
                <p>No poems match the current filters</p>
            )}
        </div>
    );
}