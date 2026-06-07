// app/map/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import LocationMap from '../../components/LocationMap.prod.jsx';
import ChapterDropdown from '../../components/ChapterDropdown.prod.jsx';

export default function MapPage() {
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [mapData, setMapData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
                const results = await Promise.all(
                    selectedChapters.map(chapter => 
                        fetch(`/api/spaces-location?chapter=${chapter}`).then(r => r.json())
                    )
                );

                // Merge all results together
                const merged = {
                    places: [],
                    poems: {}
                };

                const seenPlaces = new Set();

                results.forEach(data => {
                    // Merge poems
                    Object.assign(merged.poems, data.poems);

                    // Merge places, avoiding duplicates
                    data.places?.forEach(place => {
                        if (!seenPlaces.has(place.name)) {
                            seenPlaces.add(place.name);
                            merged.places.push(place);
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
    }, [selectedChapters]);

    return (
        <div style = {{ display: 'flex', gap: '30px', margin: '20px', overflow: 'hidden', height: '100%' }}>

            {/* LEFT SIDEBAR AREA */}
            <aside style={{ width: '350px', flexShrink: 0 }}>
                <ChapterDropdown 
                    value={selectedChapters}
                    onChange={(chapters) => setSelectedChapters(chapters)}
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