// app/map/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import LocationMap from '../../components/LocationMap.prod.jsx';
import ChapterDropdown from '../../components/ChapterDropdown.prod.jsx';
import LocationDropdown from '../../components/LocationDropdown.prod.jsx';

export default function MapPage() {
    const [mapData, setMapData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedLocations, setSelectedLocations] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = sessionStorage.getItem('locations_selected');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        sessionStorage.setItem('locations_selected', JSON.stringify(selectedLocations));
    }, [selectedLocations]);

    const [selectedChapters, setSelectedChapters] = useState(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = sessionStorage.getItem('chapters_selected');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        sessionStorage.setItem('chapters_selected', JSON.stringify(selectedChapters));
    }, [selectedChapters]);

    const legendItems = [
        {color: '#CC683D', label: 'PROJECTED'},
        {color: '#BFAE93', label: 'FICTIONAL WITH CITATION'},
        {color: '#767D43', label: 'HISTORICAL'},
        {color: '#EDB940', label: 'FICTIONAL WITHOUT CITATION'}
    ];

    useEffect(() => {
        console.log('selectedChapters:', selectedChapters);
        console.log('mapData:', mapData);

        async function loadDatabaseContent() {
            setIsLoading(true);
            try {
                const locationsSet = new Set(selectedLocations);

                const results = await Promise.all(
                    selectedChapters.map(chapter =>
                        fetch(`/api/spaces-location?chapter=${chapter}`).then(r => r.json())
                    )
                );

                const merged = { places: [], dimPlaces: [], poems: {}, dimPoems: {} };
                const seenPlaces = new Set();

                results.forEach(data => {
                    if (locationsSet.size === 0) {
                        Object.assign(merged.poems, data.poems);
                    } else {
                        Object.entries(data.poems).forEach(([pnum, poem]) => {
                            const isMatch =
                                locationsSet.has(poem.composition?.placeName) ||
                                locationsSet.has(poem.receipt?.placeName);
                            if (isMatch) {
                                merged.poems[pnum] = poem;
                            } else {
                                merged.dimPoems[pnum] = poem;
                            }
                        });
                    }

                    data.places?.forEach(place => {
                        if (!seenPlaces.has(place.name)) {
                            seenPlaces.add(place.name);
                            if (locationsSet.size === 0 || locationsSet.has(place.name)) {
                                merged.places.push(place);
                            } else {
                                merged.dimPlaces.push(place);
                            }
                        }
                    });
                });

                setMapData(merged);
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setIsLoading(false);
            }
        }
        if (selectedChapters.length > 0) {
            loadDatabaseContent();
        } else {
            setMapData(null);
        }
    }, [selectedChapters, selectedLocations]);

    return (
        <div style = {{ display: 'flex', gap: '30px', padding: '20px', height: '81vh' }}>

            {/* LEFT SIDEBAR AREA */}
            <aside style={{ width: '350px', flexShrink: 0 }}>
                <ChapterDropdown 
                    value={selectedChapters}
                    onChange={(chapters) => setSelectedChapters(chapters)}
                />
                <LocationDropdown
                    value={selectedLocations}
                    onChange={(locations) => setSelectedLocations(locations)}
                />
                <div>
                    {legendItems.map((item, idx) => (
                        <div key={idx} className="legend-item">
                            <div className="legend-color" style={{ background: item.color }}></div>
                            <p className="legend-text">{item.label}</p>
                        </div>
                    ))}
                </div>
            </aside>

            {isLoading ? (
                <div>Loading Locations...</div>
            ) : mapData ? (
                <LocationMap initialData={mapData} /> 
            ) : (
                <p>Select a chapter to view the map</p>
            )}
        </div>
    );
}