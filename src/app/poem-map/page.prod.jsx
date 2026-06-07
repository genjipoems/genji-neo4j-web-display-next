// app/map/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import LocationMap from '../../components/LocationMap.prod.jsx';
import MapSidebar from '../../components/MapSidebar.prod.jsx';

export default function MapPage() {
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [mapData, setMapData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hoveredMapItem, setHoveredMapItem] = useState(null);

    const legendItems = [
        {color: '#CC683D', label: 'PROJECTED'},
        {color: '#BFAE93', label: 'FICTIONAL WITH CITATION'},
        {color: '#767D43', label: 'HISTORICAL'},
        {color: '#EDB940', label: 'FICTIONAL WITHOUT CITATION'}
    ];

    useEffect(() => {
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
            setHoveredMapItem(null);
            setIsLoading(false);
        }
    }, [selectedChapters]);

    return (
        <div style = {{ display: 'flex', gap: '30px', margin: '20px', overflow: 'hidden', height: '100%' }}>

            <MapSidebar
                selectedChapters={selectedChapters}
                onChapterChange={(chapters) => setSelectedChapters(chapters)}
                legendItems={legendItems}
                hoveredMapItem={hoveredMapItem}
                mapData={mapData}
            />

            {isLoading ? (
                <div>Loading Locations...</div>
            ) : (
                <LocationMap
                    initialData={mapData}
                    hoveredMapItem={hoveredMapItem}
                    onHoverMapItem={setHoveredMapItem}
                /> 
            )}
        </div>
    );
}
