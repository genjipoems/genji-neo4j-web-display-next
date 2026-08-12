'use client';

import React, { useState, useEffect, useRef } from "react";
import '../styles/pages/locationMap.css';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/pages/characterProfile.module.css';

export default function CharacterMap({ initialData, selectedTranslator = 'washburn'}) {
    const { isAdmin } = useAuth();
    const places = initialData?.places || [];
    const dimPlaces = initialData?.dimPlaces || [];
    const rawPoems = initialData?.poems ? Object.values(initialData.poems) : [];
    const rawDimPoems = initialData?.dimPoems ? Object.values(initialData.dimPoems) : [];
    const allPlacesForRender = [
        ...places.map(p => ({ ...p, dim: false })),
        ...dimPlaces.map(p => ({ ...p, dim: true })),
    ];
    const [lastDropInfo, setLastDropInfo] = useState(null); //devtool
    const [simulatedNodes, setSimulatedNodes] = useState([]);
    const [simulatedLinks, setSimulatedLinks] = useState([]);
    const [placePositions, setPlacePositions] = useState({});
    const [transform, setTransform] = useState({ x: 475, y: 325, scale: 0.5 });
    const hoveredPnumRef = useRef(null);
    const hoveredPlaceRef = useRef(null);
    const hoveredRRef = useRef(null);
    const draggingPlaceRef = useRef(null);
    const isPanningRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const svgRef = useRef(null);
    const dragPositionRef = useRef(null);
    const hasDraggedRef = useRef(false);
    const [hoveredLinkId, setHoveredLinkId] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedPlaceName, setSelectedPlaceName] = useState(null);
    const [selectedLinkIdx, setSelectedLinkIdx] = useState(null);
    const sortedLinks = [...simulatedLinks].sort((a, b) => (a.dim === b.dim ? 0 : a.dim ? -1 : 1));
    const sortedNodes = [...simulatedNodes].sort((a, b) => (a.dim === b.dim ? 0 : a.dim ? -1 : 1));
    const sortedPlaces = [...allPlacesForRender].sort((a, b) => (a.dim === b.dim ? 0 : a.dim ? -1 : 1));

    useEffect(() => {
        const allPlaces = [...places, ...dimPlaces];
        if (allPlaces.length > 0) {
            const initial = {};
            allPlaces.forEach(place => {
                initial[place.name] = { x: Number(place.lng), y: Number(place.lat) };
            });
            setPlacePositions(initial);
        }
    }, [initialData?.places, initialData?.dimPlaces]);

    const getPageUrl = () => {
        if (selectedPlaceName) {
            return `/location-page/${encodeURIComponent(selectedPlaceName)}`;
        }
        if (selectedNodeId) {
            const node = simulatedNodes.find(n => n.id === selectedNodeId);
            if (node) return `/characters/${encodeURIComponent(node.label)}`;
        }
        if (selectedLinkIdx) {
            const link = sortedLinks[selectedLinkIdx]
            if (link) {
            return `/poems/${link.pnum.substring(0, 2).replace(/^0+/, '')}/${link.pnum.slice(-2).replace(/^0+/, '')}`;
            }
        }
        return null;
    };
    const pageUrl = getPageUrl();

    const handleNodeMouseOver = (node) => {
        hoveredPnumRef.current = node.pnum;

        simulatedNodes.forEach(n => {
            const el = document.getElementById(`node-${n.id}`);
            if (!el) return;
            const highlighted = n.pnum === node.pnum ||
                n.groupPoems.includes(node.pnum) ||
                n.replyPoems.includes(node.pnum) ||
                n.repliesToThis.includes(node.pnum);
            el.setAttribute('fill', highlighted && n.gender === 'female' ? '#ff7d69' : highlighted ? '#c8fdf6' : n.gender === 'female' ? '#B03F2E' : '#9CBAB6');
            el.setAttribute('stroke', highlighted ? '#FFF' : '#252525');
        });

        const el = document.getElementById('translation-display');
        el.innerHTML = (node.translation || '').replace(/\n/g, '<br>');
        document.getElementById('chapter-display').innerHTML = `CHAPTER: ${node.chapter}`;
        document.getElementById('poemnum-display').innerHTML = `POEM: ${node.poem}`;

        const mess = document.getElementById('messenger-display');
        if (mess) mess.innerHTML = `MESSENGER: ${node.messenger}`;
        const sp = document.getElementById('speaker-display');
        if (sp) sp.innerHTML = `SPEAKER: ${node.speaker}`;
        const ad = document.getElementById('addressee-display');
        if (ad) ad.innerHTML = `ADDRESSEE: ${node.addressee}`;

        document.getElementById('translation-outer')?.classList.add('poem-active');
    };

    const handleNodeMouseOut = () => {
        hoveredPnumRef.current = null;

        simulatedNodes.forEach(n => {
            const el = document.getElementById(`node-${n.id}`);
            if (!el) return;
            el.setAttribute('fill', n.gender === 'female' ? '#B03F2E' : '#9CBAB6');
            el.setAttribute('stroke', '#252525');
        });

        ['translation-display', 'chapter-display', 'poemnum-display', 'addressee-display', 'speaker-display', 'messenger-display']
            .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });

        document.getElementById('translation-outer')?.classList.remove('poem-active');
    };

    const handleMergedMouseOver = (node) => {
        hoveredPnumRef.current = node.pnum;
        const totalCount = node.poems.length;                          // how many poems total
        const nonDimCount = node.poems.filter(p => !p.dim).length;      // how many are NOT dim
        const pnumList = node.poems.map(p => p.pnum);                   // just an array of pnums, e.g. ['12-03','15-01']

        simulatedNodes.forEach(n => {
            const el = document.getElementById(`node-${n.id}`);
            if (!el) return;
            const highlighted = n.pnum === node.pnum ||
                n.groupPoems.includes(node.pnum) ||
                n.replyPoems.includes(node.pnum) ||
                n.repliesToThis.includes(node.pnum);
            el.setAttribute('fill', highlighted && n.gender === 'female' ? '#ff7d69' : highlighted ? '#c8fdf6' : n.gender === 'female' ? '#B03F2E' : '#9CBAB6');
            el.setAttribute('stroke', highlighted ? '#FFF' : '#252525');
        });
        const el = document.getElementById('translation-display')
        el.innerHTML = (`LIST OF POEM CODES COMPOSED OR RECEIVED HERE: ${pnumList}` || '')
        .replace(/\n/g, '<br>');
        const ch = document.getElementById('chapter-display')
        ch.innerHTML = (`TOTAL POEMS: ${totalCount}` || '')

        const pn = document.getElementById('poemnum-display')
        pn.innerHTML = (`ACTIVE POEMS: ${nonDimCount}` || '')

        const sp = document.getElementById('speaker-display')
        if (sp) sp.innerHTML = (`SPEAKER: ${node.label}` || '');



        document.getElementById(`translation-outer`)?.classList.add('poem-active');
    };

    const handleMergedMouseOut = () => {

        hoveredPnumRef.current = null;
        
        simulatedNodes.forEach(n => {
            const el = document.getElementById(`node-${n.id}`);
            if (!el) return;
            el.setAttribute('fill', n.gender === 'female' ? '#B03F2E' : '#9CBAB6');
            el.setAttribute('stroke', '#252525');
        });
        const el = document.getElementById('translation-display')
        const ch = document.getElementById('chapter-display')
        const pn = document.getElementById('poemnum-display')
        const sp = document.getElementById('speaker-display')
        document.getElementById(`translation-outer`)?.classList.remove('poem-active');

        if (el) el.textContent = '';
        if (ch) ch.textContent = '';
        if (pn) pn.textContent = '';
        if (sp) sp.textContent = '';
    };

    const clearAllSelections = () => {
        if (selectedNodeId) {
            handleMergedMouseOut();
            handleNodeMouseOut();
        }
        if (selectedPlaceName) handlePlaceMouseOut();
        if (selectedLinkIdx !== null) handleRMouseOut();
        setSelectedNodeId(null);
        setSelectedPlaceName(null);
        setSelectedLinkIdx(null);
    };

    const handleBackgroundClick = () => {
        setSelectedNodeId(null);
        setSelectedPlaceName(null);
        setSelectedLinkIdx(null);
        handleNodeMouseOut();
        handleMergedMouseOut();
        handlePlaceMouseOut();
        handleRMouseOut();
    };

    const handlePlaceMouseOver = (place) => {
        hoveredPlaceRef.current = place.name;

        const el = document.getElementById('translation-display');
        el.innerHTML = place.description || '';
        el.classList.add('place-description');

        document.getElementById('poemnum-display').innerHTML = `TYPE: ${place.type}`;
        document.getElementById('chapter-display').innerHTML = `LOCATION: ${place.name}`;
        document.getElementById('chapter-poem').classList.add('place-active');
        document.getElementById('speaker-addressee-mess').style.display = 'none';
        document.getElementById('translation-outer').classList.add('place-active');
    };

    const handlePlaceHover = (place) => {
        document.getElementById(`place-${place.name}`)?.classList.add('hovered');
    }

    const handlePlaceMouseOut = () => {
        hoveredPlaceRef.current = null;
        const el = document.getElementById('translation-display')
        const ch = document.getElementById('chapter-display')
        const pn = document.getElementById('poemnum-display')
        const ad = document.getElementById('addressee-display')
        const sp = document.getElementById('speaker-display')
        const mess = document.getElementById('messenger-display')
        document.getElementById('translation-display').classList.remove('place-description');
        document.getElementById('poemnum-display').classList.remove('place-type');
        document.getElementById('chapter-display').classList.remove('place-name');
        document.getElementById('chapter-poem').classList.remove('place-active');
        document.getElementById('speaker-addressee-mess').style.display = '';
        document.getElementById('translation-outer').classList.remove('place-active');

        if (el) el.textContent = '';
        if (ch) ch.textContent = '';
        if (pn) pn.textContent = '';
        if (ad) ad.textContent = '';
        if (sp) sp.textContent = '';
        if (mess) mess.textContent = '';
    };

    const handlePlaceUnhover = (place) => {
        document.getElementById(`place-${place.name}`)?.classList.remove('hovered');
    }
    const handleRMouseOver = (link, src, tgt) => {
        hoveredRRef.current = link.idx;

        const el = document.getElementById('translation-display');

        const srcToggleHtml = isAdmin ? `
            <button
                role="switch"
                aria-checked="${src.verified === true}"
                class="toggle-switch ${src.verified === true ? 'on' : ''}"
                data-pnum="${src.pnum}"
                data-field="src"
            >
                <span class="toggle-thumb"></span>
            </button>
        ` : '';

        const tgtToggleHtml = isAdmin ? `
            <button
                role="switch"
                aria-checked="${tgt.verified === true}"
                class="toggle-switch ${tgt.verified === true ? 'on' : ''}"
                data-pnum="${tgt.pnum}"
                data-field="tgt"
            >
                <span class="toggle-thumb"></span>
            </button>
        ` : '';
        el.innerHTML = `<div>${ src.translation.replace(/\n/g, '<br   >') }</div>
        <div class="evidence-block">
            <div class="comp-block">
                <p>Composition evidence: ${src.evidence}</p>
                <label class="switch-row">
                    <span class="verify-status">${src.verified === true ? 'AI Generated, Human Verified' : 'AI Generated'}</span>
                    ${srcToggleHtml}
                </label>
            </div>
            <div class="rec-block">
                <p>Receipt evidence: ${tgt.evidence}</p>
                <label class="switch-row">
                    <span class="verify-status">${tgt.verified === true ? 'AI Generated, Human Verified' : 'AI Generated'}</span>
                    ${tgtToggleHtml}
                </label>
            </div>
        </div>
        `;
    
        el.querySelectorAll('.toggle-switch').forEach((btn) => {
btn.addEventListener('click', async () => {
    const pnum = btn.dataset.pnum;
    const field = btn.dataset.field;
    const relType = field === 'src' ? 'composition' : 'receipt';
    const isOn = btn.classList.contains('on');
    const nextVerified = !isOn;

    const label = btn.closest('.switch-row');
    const statusSpan = label.querySelector('.verify-status');

    // optimistic UI update
    btn.classList.toggle('on');
    btn.setAttribute('aria-checked', String(nextVerified));
    statusSpan.textContent = nextVerified ? 'AI Generated, Human Verified' : 'AI Generated';
    btn.disabled = true;

    try {
        const res = await fetch(`../api/neo4j_driver/${pnum}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ relType, verified: nextVerified }),
        });
        if (!res.ok) throw new Error('Update failed');
    } catch (err) {
        // revert both switch AND text on failure
        btn.classList.toggle('on');
        btn.setAttribute('aria-checked', String(isOn));
        statusSpan.textContent = isOn ? 'AI Generated, Human Verified' : 'AI Generated';
        console.error(err);
    } finally {
        btn.disabled = false;
    }
});
        });
        const ch = document.getElementById('chapter-display')
        ch.innerHTML = (`CHAPTER: ${src.chapter}` || '')

        const pn = document.getElementById('poemnum-display')
        pn.innerHTML = (`POEM: ${src.poem}` || '')

        const mess = document.getElementById('messenger-display')
        if (mess) mess.innerHTML = (`MESSENGER: ${src.messenger}` || '');

        const sp = document.getElementById('speaker-display')
        if (sp) sp.innerHTML = (`SPEAKER: ${src.speaker}` || '');

        const ad = document.getElementById('addressee-display')
        if (ad) ad.innerHTML = (`ADDRESSEE: ${tgt.addressee}` || '');
        document.getElementById('translation-display').classList.add('place-description');
        document.getElementById('chapter-poem').classList.add('place-active');
        document.getElementById('translation-outer').classList.add('place-active');

    };

    const handleRMouseOut = () => {
        hoveredRRef.current = null;
        
        const el = document.getElementById('translation-display')
        const ch = document.getElementById('chapter-display')
        const pn = document.getElementById('poemnum-display')
        const ad = document.getElementById('addressee-display')
        const sp = document.getElementById('speaker-display')
        const mess = document.getElementById('messenger-display')

        document.getElementById('translation-display').classList.remove('place-description');
        document.getElementById('chapter-poem').classList.remove('place-active');
        document.getElementById('translation-outer').classList.remove('place-active');


        if (el) el.textContent = '';
        if (ch) ch.textContent = '';
        if (pn) pn.textContent = '';
        if (ad) ad.textContent = '';
        if (sp) sp.textContent = '';
        if (mess) mess.textContent = '';
    };

    // SVG coordinate conversion
    const toSVGCoords = (clientX, clientY) => {
        const svg = svgRef.current.getBoundingClientRect();
        const x = (clientX - svg.left - transform.x) / transform.scale;
        const y = (clientY - svg.top - transform.y) / transform.scale;
        return { x, y };
    };
    const zoomToCenter = (factor) => {
        const svg = svgRef.current.getBoundingClientRect();
        const centerX = svg.width/2;
        const centerY = svg.height/2;
        setTransform(prev => {
            const newScale = Math.max(0.1, Math.min(10, prev.scale * factor));
            return {
            scale: newScale,
            x: centerX - (centerX - prev.x) * (newScale / prev.scale),
            y: centerY - (centerY - prev.y) * (newScale / prev.scale),
            };
        });
    }
    const handleWheel = (e) => {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(10, transform.scale * scaleFactor));

        // Zoom toward mouse position
        const svg = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svg.left;
        const mouseY = e.clientY - svg.top;

        setTransform(prev => ({
            scale: newScale,
            x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
            y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        }));
    };

    const handleMouseDown = (e) => {
        if (draggingPlaceRef.current) return;
        isPanningRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (draggingPlaceRef.current) {
            hasDraggedRef.current = true;
            const { x, y } = toSVGCoords(e.clientX, e.clientY);
            dragPositionRef.current = { x, y };

            const el = document.getElementById(`place-${draggingPlaceRef.current}`);
            if (el) el.setAttribute('transform', `translate(${x}, ${y})`);
            return;
        }

        if (isPanningRef.current) {
            const dx = e.clientX - lastMouseRef.current.x;
            const dy = e.clientY - lastMouseRef.current.y;
            lastMouseRef.current = { x: e.clientX, y: e.clientY };
            setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
    };

    const handleMouseUp = () => {
        isPanningRef.current = false;
        if (draggingPlaceRef.current && dragPositionRef.current) {
            const name = draggingPlaceRef.current;
            const { x, y } = dragPositionRef.current;
            setPlacePositions(prev => ({ ...prev, [name]: { x, y } }));
            setLastDropInfo({ name, x: Math.round(x), y: Math.round(y) }); //devtool
            dragPositionRef.current = null;
        }
        draggingPlaceRef.current = null;
        // Reset AFTER click fires (click follows mouseup synchronously but after a tick)
        setTimeout(() => { hasDraggedRef.current = false; }, 0);
    };
    const personPlaceKey = (placeName, personName) => `${placeName}::${personName}`;

    const mergedNodeId = (placeName, personName) =>
        `person-${placeName}::${personName}`.replace(/[^a-zA-Z0-9:_-]/g, '_');

    const getAnchor = (node, towardX, towardY, radius, angleOffset = 0) => {
        const dx = towardX - node.x;
        const dy = towardY - node.y;
        const baseAngle = Math.atan2(dy, dx) + angleOffset;
        return {
            x: node.x + Math.cos(baseAngle) * radius,
            y: node.y + Math.sin(baseAngle) * radius,
        };
    };
    const distancePointToSegment = (px, py, x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.hypot(px - projX, py - projY);
    };
    const getBowPath = (x1, y1, x2, y2, bow = 0, awayFrom = null) => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        let nx = -dy / len;
        let ny = dx / len;

        if (awayFrom) {
            // test both perpendicular directions, keep whichever bulges further from the place center
            const d1 = Math.hypot((mx + nx * bow) - awayFrom.x, (my + ny * bow) - awayFrom.y);
            const d2 = Math.hypot((mx - nx * bow) - awayFrom.x, (my - ny * bow) - awayFrom.y);
            if (d2 > d1) { nx = -nx; ny = -ny; }
        }

        const cx = mx + nx * bow;
        const cy = my + ny * bow;
        return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
    };

    const assignLinkBows = (links) => {
        const personPairGroups = new Map();

        links.forEach((link) => {
            const speaker = link.srcPoem?.speaker ?? '';
            const addressee = link.tgtPoem?.addressee ?? '';
            const key = [speaker, addressee].sort().join('::');
            if (!personPairGroups.has(key)) personPairGroups.set(key, []);
            personPairGroups.get(key).push(link);
        });

        personPairGroups.forEach((group) => {
            group.sort((a, b) => (a.pnum || '').localeCompare(b.pnum || ''));
            const n = group.length;
            group.forEach((link, i) => {
                // wider, evenly spaced bows — same pair always gets same ordering
                link.bow = n === 1 ? 0 : (i - (n - 1) / 2) * 30;
            });
        });
    };

    const assignFanAnchors = (nodes, links) => {
        const byNode = new Map();
        links.forEach((link) => {
            [link.sourceId, link.targetId].forEach((nodeId) => {
                if (!byNode.has(nodeId)) byNode.set(nodeId, []);
                byNode.get(nodeId).push(link);
            });
        });

        byNode.forEach((nodeLinks, nodeId) => {
            const node = nodes.find((n) => n.id === nodeId);
            if (!node?.merged) return;

            nodeLinks.sort((a, b) => {
                const otherA = nodes.find((n) => n.id === (a.sourceId === nodeId ? a.targetId : a.sourceId));
                const otherB = nodes.find((n) => n.id === (b.sourceId === nodeId ? b.targetId : b.sourceId));
                const angleA = Math.atan2(otherA.y - node.y, otherA.x - node.x);
                const angleB = Math.atan2(otherB.y - node.y, otherB.x - node.x);
                return angleA - angleB;
            });

            const spread = Math.min(Math.PI * 0.8, nodeLinks.length * 0.25);
            nodeLinks.forEach((link, i) => {
                const offset = nodeLinks.length === 1 ? 0 : (i / (nodeLinks.length - 1) - 0.5) * spread;
                if (link.sourceId === nodeId) link.sourceAngleOffset = offset;
                else link.targetAngleOffset = offset;
            });
        });
    };
    // Physics simulation
    useEffect(() => {
        if ((rawPoems.length === 0 && rawDimPoems.length === 0) || (places.length === 0 && dimPlaces.length === 0) || Object.keys(placePositions).length === 0) return;
        let nodes = [];
        let links = [];

        const poemsToProcess = [
            ...rawPoems.map(poem => ({ poem, dim: false })),
            ...rawDimPoems.map(poem => ({ poem, dim: true })),
        ];

        // PASS 1: count appearances per (place, person)
        const appearanceCounts = new Map();
        poemsToProcess.forEach(({ poem }) => {
            const compPlace = poem.composition?.placeName;
            const recPlace = poem.receipt?.placeName;
            const speaker = poem.composition?.speaker ?? 'Unknown Sender';
            const addressee = poem.receipt?.addressee ?? 'Unknown Recipient';

            if (compPlace && poem.composition?.lng != null && poem.composition?.lat != null) {
                const key = personPlaceKey(compPlace, speaker);
                appearanceCounts.set(key, (appearanceCounts.get(key) || 0) + 1);
            }
            if (recPlace && poem.receipt?.lng != null && poem.receipt?.lat != null) {
                const key = personPlaceKey(recPlace, addressee);
                appearanceCounts.set(key, (appearanceCounts.get(key) || 0) + 1);
            }
        });

        const mergedNodesMap = new Map();

        poemsToProcess.forEach(({ poem, dim }, index) => {
            const compPlaceName = poem.composition?.placeName;
            const recPlaceName = poem.receipt?.placeName;
            const currentCompPos = compPlaceName ? placePositions[compPlaceName] : null;
            const currentRecPos = recPlaceName ? placePositions[recPlaceName] : null;

            const compX = currentCompPos ? currentCompPos.x : (poem.composition?.lng != null ? Number(poem.composition.lng) : NaN);
            const compY = currentCompPos ? currentCompPos.y : (poem.composition?.lat != null ? Number(poem.composition.lat) : NaN);
            const recX = currentRecPos ? currentRecPos.x : (poem.receipt?.lng != null ? Number(poem.receipt.lng) : NaN);
            const recY = currentRecPos ? currentRecPos.y : (poem.receipt?.lat != null ? Number(poem.receipt.lat) : NaN);

            const speaker = poem.composition?.speaker ?? 'Unknown Sender';
            const addressee = poem.receipt?.addressee ?? 'Unknown Recipient';
            const speakerGender = poem.composition?.speakerGender ?? 'Unknown Gender';
            const addresseeGender = poem.receipt?.addresseeGender ?? 'Unknown Gender';

            const validComp = !isNaN(compX) && !isNaN(compY);
            const validRec = !isNaN(recX) && !isNaN(recY);

            const mergeComp = validComp && appearanceCounts.get(personPlaceKey(compPlaceName, speaker)) > 1;
            const mergeRec = validRec && appearanceCounts.get(personPlaceKey(recPlaceName, addressee)) > 1;

            const compId = mergeComp ? mergedNodeId(compPlaceName, speaker) : `${poem.pnum || index}-comp`;
            const recId = mergeRec ? mergedNodeId(recPlaceName, addressee) : `${poem.pnum || index}-rec`;

            const srcPoem = {
                pnum: poem.pnum,
                translation: poem.composition?.[selectedTranslator] || null,
                evidence: poem.composition?.evidence ?? 'No evidence',
                verified: poem.composition?.verified ?? false,
                chapter: parseInt(poem.pnum.substring(0, 2)),
                poem: parseInt(poem.pnum.slice(-2)),
                speaker,
                addressee,
                messenger: poem.relationships?.messenger || 'none',
            };
            const tgtPoem = {
                pnum: poem.pnum,
                translation: poem.receipt?.[selectedTranslator] || null,
                evidence: poem.receipt?.evidence ?? 'No evidence',
                verified: poem.receipt?.verified ?? false,
                chapter: parseInt(poem.pnum.substring(0, 2)),
                poem: parseInt(poem.pnum.slice(-2)),
                speaker,
                addressee,
                messenger: poem.relationships?.messenger || 'none',
            };

            if (validComp) {
                if (mergeComp) {
                    if (!mergedNodesMap.has(compId)) {
                        mergedNodesMap.set(compId, {
                            id: compId,
                            merged: true,
                            pnum: null,
                            type: 'person',
                            gender: speakerGender,
                            label: speaker,
                            placeName: compPlaceName,
                            dim,
                            groupPoems: [], replyPoems: [], repliesToThis: [],
                            poems: [],
                            x: compX, y: compY, homeX: compX, homeY: compY + 6,
                        });
                    }
                    const mn = mergedNodesMap.get(compId);
                    if (!dim) mn.dim = false;
                    mn.groupPoems = [...new Set([...mn.groupPoems, ...(poem.relationships?.groupPoems || [])])];
                    mn.replyPoems = [...new Set([...mn.replyPoems, ...(poem.relationships?.replyPoems || [])])];
                    mn.repliesToThis = [...new Set([...mn.repliesToThis, ...(poem.relationships?.repliesToThis || [])])];
                    mn.poems.push({                         // <-- add this
                        pnum: poem.pnum,
                        dim,
                        role: 'sender',
                        translation: poem.composition?.[selectedTranslator] || null,
                    });
                } else {
                    nodes.push({
                        id: compId, pnum: poem.pnum, type: 'sender', merged: false,
                        gender: speakerGender, label: speaker, dim,
                        placeName: compPlaceName,
                        groupPoems: poem.relationships?.groupPoems || [],
                        replyPoems: poem.relationships?.replyPoems || [],
                        repliesToThis: poem.relationships?.repliesToThis || [],
                        chapter: srcPoem.chapter, poem: srcPoem.poem,
                        translation: srcPoem.translation,
                        speaker, addressee,
                        messenger: srcPoem.messenger,
                        evidence: srcPoem.evidence, verified: srcPoem.verified,
                        x: compX, y: compY, homeX: compX, homeY: compY + 6,
                    });
                }
            }

            if (validRec) {
                if (mergeRec) {
                    if (!mergedNodesMap.has(recId)) {
                        mergedNodesMap.set(recId, {
                            id: recId,
                            merged: true,
                            pnum: null,
                            type: 'person',
                            gender: addresseeGender,
                            label: addressee,
                            placeName: recPlaceName,
                            dim,
                            groupPoems: [], replyPoems: [], repliesToThis: [],
                            poems: [],
                            x: recX, y: recY, homeX: recX, homeY: recY + 6,
                        });
                    }
                    const mn = mergedNodesMap.get(recId);
                    if (!dim) mn.dim = false;
                    mn.groupPoems = [...new Set([...mn.groupPoems, ...(poem.relationships?.groupPoems || [])])];
                    mn.replyPoems = [...new Set([...mn.replyPoems, ...(poem.relationships?.replyPoems || [])])];
                    mn.repliesToThis = [...new Set([...mn.repliesToThis, ...(poem.relationships?.repliesToThis || [])])];
                    mn.poems.push({                         // <-- add this
                        pnum: poem.pnum,
                        dim,
                        role: 'receiver',
                        translation: poem.composition?.[selectedTranslator] || null,
                    });
                } else {
                    nodes.push({
                        id: recId, pnum: poem.pnum, type: 'receiver', merged: false,
                        gender: addresseeGender, label: addressee, dim,
                        placeName: recPlaceName,
                        groupPoems: poem.relationships?.groupPoems || [],
                        replyPoems: poem.relationships?.replyPoems || [],
                        repliesToThis: poem.relationships?.repliesToThis || [],
                        chapter: tgtPoem.chapter, poem: tgtPoem.poem,
                        translation: tgtPoem.translation,
                        speaker, addressee,
                        messenger: tgtPoem.messenger,
                        evidence: tgtPoem.evidence, verified: tgtPoem.verified,
                        x: recX, y: recY, homeX: recX, homeY: recY + 6,
                    });
                }
            }

            if (validComp && validRec) {
                links.push({
                    sourceId: compId,
                    targetId: recId,
                    dim,
                    pnum: poem.pnum,
                    srcPoem,
                    tgtPoem,
                });
            }
        });

        nodes = [...nodes, ...mergedNodesMap.values()];
        const boxWidthBuffer = 100;         // was 85 — closer to place edge
        const boxHeightBuffer = 50;        // was 40
        const iterations = 100;
        const gravityStrength = 0.2;      // was 0.2
        const idealNodeDistance = 48;      // was 48 — less repulsion drift
        const linkStrength = 0.1;
        const linkNodes = new Set();
        const nonLinkNodes = new Set();
        const matchLink = [];
        const nonRecNodes = [];

        function snapToPerim(nodeSet) {
            for (let i = 0; i < 50; i++) {
                for (let node of nodeSet) {
                    let dx = node.x - node.homeX;
                    let dy = node.y - node.homeY;
                    if (dx === 0 && dy === 0) dy = -1;
                    const angle = Math.atan2(dy, dx);
                    const absCos = Math.abs(Math.cos(angle));
                    const absSin = Math.abs(Math.sin(angle));
                    let targetX = node.homeX;
                    let targetY = node.homeY;
                    if (boxWidthBuffer * absSin > boxHeightBuffer * absCos) {
                        targetY += Math.sign(dy) * boxHeightBuffer;
                        targetX += (Math.sign(dy) * boxHeightBuffer) / Math.tan(angle);
                    } else {
                        targetX += Math.sign(dx) * boxWidthBuffer;
                        targetY += (Math.sign(dx) * boxWidthBuffer) * Math.tan(angle);
                    }
                    node.x += (targetX - node.x) * gravityStrength;
                    node.y += (targetY - node.y) * gravityStrength;
                }
            }
        }

        function snapAllToPerim(allNodes) {
            for (let i = 0; i < 80; i++) {
                for (let node of allNodes) {
                    let dx = node.x - node.homeX;
                    let dy = node.y - node.homeY;
                    if (dx === 0 && dy === 0) dy = -1;
                    const angle = Math.atan2(dy, dx);
                    const absCos = Math.abs(Math.cos(angle));
                    const absSin = Math.abs(Math.sin(angle));
                    let targetX = node.homeX;
                    let targetY = node.homeY;
                    if (boxWidthBuffer * absSin > boxHeightBuffer * absCos) {
                        targetY += Math.sign(dy) * boxHeightBuffer;
                        targetX += (Math.sign(dy) * boxHeightBuffer) / Math.tan(angle);
                    } else {
                        targetX += Math.sign(dx) * boxWidthBuffer;
                        targetY += (Math.sign(dx) * boxWidthBuffer) * Math.tan(angle);
                    }
                    node.x += (targetX - node.x) * 0.55;
                    node.y += (targetY - node.y) * 0.55;
                }
            }
        }

        const mergedByPlace = new Map();
        nodes.filter(n => n.merged).forEach(n => {
            if (!mergedByPlace.has(n.placeName)) mergedByPlace.set(n.placeName, []);
            mergedByPlace.get(n.placeName).push(n);
        });

        mergedByPlace.forEach((placeNodes) => {
            placeNodes.forEach((node, i) => {
                const angle = (i / placeNodes.length) * Math.PI * 2 - Math.PI / 2;
                node.x = node.homeX + Math.cos(angle) * boxWidthBuffer * 0.85;
                node.y = node.homeY + Math.sin(angle) * boxHeightBuffer * 0.85;
                node.pinX = node.x;   // ← add these
                node.pinY = node.y;
            });
        });

        for (let link of links) {
            const sourceNode = nodes.find(n => n.id === link.sourceId);
            const targetNode = nodes.find(n => n.id === link.targetId);
            if (!sourceNode || !targetNode) continue; // Safety condition moved up to prevent array mutations on broken references
            nonRecNodes.push(sourceNode);
            
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            if (dx === 0 && dy === 0) {
                if (!sourceNode.merged) {
                    sourceNode.x += (Math.random() - 0.5) * 10;
                    sourceNode.y += (Math.random() - 0.5) * 10;
                }
                matchLink.push(link);
                nonLinkNodes.add(sourceNode);
            } else {
                const Xoff = (Math.random() - 0.5) * 50;
                const Yoff = (Math.random() - 0.5) * 50;
                nonRecNodes.push(targetNode);
                linkNodes.add(sourceNode);
                linkNodes.add(targetNode);

                // Jitter only non-merged nodes
                if (!sourceNode.merged) {
                    sourceNode.x += Xoff;
                    sourceNode.y += Yoff;
                }
                if (!targetNode.merged) {
                    targetNode.x += Xoff;
                    targetNode.y += Yoff;
                }

                // Link pull only moves NON-merged nodes
                if (!sourceNode.merged) {
                    sourceNode.x += dx * linkStrength;
                    sourceNode.y += dy * linkStrength;
                }
                if (!targetNode.merged) {
                    targetNode.x -= dx * linkStrength;
                    targetNode.y -= dy * linkStrength;
                }
            }
        }

        snapToPerim(linkNodes);

        for (let i = 0; i < iterations; i++) {
            for (let a = 0; a < nonRecNodes.length; a++) {
                for (let b = a + 1; b < nonRecNodes.length; b++) {
                    let dx = nonRecNodes[b].x - nonRecNodes[a].x;
                    let dy = nonRecNodes[b].y - nonRecNodes[a].y;
                    if (dx === 0 && dy === 0) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < idealNodeDistance) {
                        const force = (idealNodeDistance - distance) / distance * 0.5;
                        const pushX = dx * force;
                        const pushY = dy * force;
                        const aIsFixed = linkNodes.has(nonRecNodes[a]);
                        const bIsFixed = linkNodes.has(nonRecNodes[b]);
                        let factorA = aIsFixed && bIsFixed ? 1 : aIsFixed ? 0 : bIsFixed ? 1.5 : .6;
                        let factorB = aIsFixed && bIsFixed ? 1 : aIsFixed ? 1.5 : bIsFixed ? 0 : .6;
                        nonRecNodes[a].x -= pushX * factorA;
                        nonRecNodes[a].y -= pushY * factorA;
                        nonRecNodes[b].x += pushX * factorB;
                        nonRecNodes[b].y += pushY * factorB;
                    }
                }
            }
        }

        snapToPerim(nonLinkNodes);
        snapToPerim(linkNodes);

        for (let link of matchLink) {
            const sourceNode = nodes.find(n => n.id === link.sourceId);
            const targetNode = nodes.find(n => n.id === link.targetId);
            if (!sourceNode || !targetNode) continue;
            let dx = sourceNode.x - sourceNode.homeX;
            let dy = sourceNode.y - sourceNode.homeY;
            if (dx === 0 && dy === 0) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; }
            const dist = Math.sqrt(dx * dx + dy * dy);
            targetNode.x = sourceNode.x + (dx / dist) * 45;
            targetNode.y = sourceNode.y + (dy / dist) * 45;
        }

        snapAllToPerim(nodes);   
        nodes.filter(n => n.merged).forEach(n => {
            n.x = n.pinX;
            n.y = n.pinY;
        });

        assignLinkBows(links);
        assignFanAnchors(nodes, links);
        setSimulatedNodes(nodes);
        setSimulatedLinks(links);

    }, [initialData?.poems, initialData?.dimPoems, initialData?.places, initialData.dimPlaces, placePositions, selectedTranslator]);

    const placeColor = (type) => {
        if (type === "fictional with evidence") return "#BFAE93";
        if (type === "historical") return "#767D43";
        if (type === "fictional without evidence") return "#EDB940";
        if (type === "projected") return "#CC683D";
        return "#FFF";
    };

    return (
        <div className="map-container">
            <div className="zoombuttons">
                <button className="zoomIn" onClick={() => zoomToCenter(1.3)}>
                    +
                </button>
                <button className="zoomOut" onClick={() => zoomToCenter(0.7)}>
                    -
                </button>
            </div>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                //style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab', display: 'block' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleBackgroundClick}
            >
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="13" refY="5" markerWidth={6} markerHeight={6} orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#fff" />
                    </marker>
                </defs>

                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                    {/* 3. MAJOR SECTIONS */}
                    {
                        <g>
                            <rect
                                x={-850} y={-600}
                                width={400} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <rect
                                x={850} y={-600}
                                width={400} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-850} y={-625} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Hokuhen Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-850} y={-300}
                                width={400} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <rect
                                x={850} y={-300}
                                width={400} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-850} y={-325} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Ichijō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-850} y={0}
                                width={400} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <rect
                                x={850} y={0}
                                width={400} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-850} y={-25} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Nijō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-400} y={-600}
                                width={1200} height={900}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-400} y={-625} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"The Greater Imperial Palace"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-400} y={350}
                                width={1200} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-400} y={325} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Sanjō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-400} y={600}
                                width={1200} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-400} y={575} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Shijō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-400} y={850}
                                width={1200} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-400} y={825} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Gojō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-400} y={1100}
                                width={1200} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-400} y={1075} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Rokujō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                            <rect
                                x={-400} y={1350}
                                width={1200} height={200}
                                fill="none"
                                stroke="#DFD6C8"
                                strokeWidth={2}
                                rx={8}
                                strokeDasharray={"8 6"}
                                opacity={'50%'}
                            />
                            <foreignObject x={-400} y={1325} width={250} height={20}>
                                <div style={{textAlign: "left"}}>
                                    <div style={{color: "white", fontFamily: "Lexend"}}>
                                        {"Kujō Avenue"}
                                    </div>
                                </div>
                            </foreignObject>
                        </g>
                    }
                    {/* 1. LINKS */}
                    {sortedLinks.map((link, idx) => {
                        const src = simulatedNodes.find(n => n.id === link.sourceId);
                        const tgt = simulatedNodes.find(n => n.id === link.targetId);
                        if (!src || !tgt) return null;

                        const srcRadius = src.merged ? 9 : 6;
                        const tgtRadius = tgt.merged ? 9 : 6;
                        const srcAnchor = getAnchor(src, tgt.x, tgt.y, srcRadius, link.sourceAngleOffset || 0);
                        const tgtAnchor = getAnchor(tgt, src.x, src.y, tgtRadius, link.targetAngleOffset || 0);
                        const isHovered = hoveredLinkId === idx;

                        // NEW: detect same-place link and force outward arc
                        const samePlace = src.placeName && src.placeName === tgt.placeName;
                        const placeCenter = samePlace ? { x: src.homeX, y: src.homeY - 6 } : null;
                        const minBow = 90;
                        let bow = link.bow || 0;
                        if (samePlace) {
                            const clearanceRadius = 90; // desired min distance from center to the curve
                            const distToCenter = distancePointToSegment(
                                placeCenter.x, placeCenter.y,
                                srcAnchor.x, srcAnchor.y,
                                tgtAnchor.x, tgtAnchor.y
                            );
                            if (distToCenter < clearanceRadius) {
                                // bezier sag is ~half of bow magnitude, so double what's needed
                                const neededBow = (clearanceRadius - distToCenter) * 2;
                                bow = bow >= 0 ? Math.max(bow, neededBow) : -Math.max(Math.abs(bow), neededBow);
                            }
                        }
                        if (samePlace && Math.abs(bow) < minBow) {
                            bow = bow >= 0 ? minBow : -minBow;
                        }

                        return (
                            <g
                                key={`link-${idx}`}
                                onMouseEnter={() => setHoveredLinkId(idx)}
                                onMouseLeave={() => setHoveredLinkId(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedLinkIdx === idx) {
                                        clearAllSelections();
                                    } else {
                                        clearAllSelections();
                                        handleRMouseOver(link, link.srcPoem, link.tgtPoem);
                                        setSelectedLinkIdx(idx);
                                    }
                                }}
                            >
                            <path
                                d={getBowPath(srcAnchor.x, srcAnchor.y, tgtAnchor.x, tgtAnchor.y, bow, placeCenter)}
                                fill="none"
                                pointerEvents={link.dim ? 'none' : 'stroke'}
                                stroke="#ffffff"
                                strokeWidth={isHovered ? 4 : 2}
                                opacity={link.dim ? 0.05 : 0.3}
                                markerEnd="url(#arrow)"
                                className="connection-line"
                            />
                        </g>
                    );
                })}
                    {/* Text labels */}
                    {sortedNodes.map((node, idx) => (
                        <foreignObject key={`label-${idx}`} x={node.x - 23} y={node.y - 46} width={46} height={40} pointerEvents={'none'}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                pointerEvents: 'none',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                textAlign: 'center',
                                lineHeight: '1.1'
                            }}>
                                <span className="poem-node-text" style={{
                                    color: '#fff',
                                    fontSize: '7.5px',
                                    visibility: node.dim ? 'hidden' : 'visible',
                                    opacity: node.dim ? 0.2 : 1,
                                    pointerEvents: 'none',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                }}>
                                    {node.label}
                                </span>
                            </div>
                        </foreignObject>
                    ))}

                    {/* Circles */}
                    {sortedNodes.map((node, idx) => (
                        <circle
                            key={`circle-${idx}`}
                            id={`node-${node.id}`}
                            cx={node.x}
                            cy={node.y}
                            r={6}
                            fill={node.gender === 'female' ? '#B03F2E' : '#9CBAB6'}
                            stroke='#252525'
                            strokeWidth={1.5}
                            pointerEvents={node.dim ? 'none' : 'auto'}
                            opacity={node.dim ? 0.3 : 1}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (selectedNodeId === node.id) {
                                    clearAllSelections();
                                } else {
                                    clearAllSelections();
                                    if (node.merged) {
                                        handleMergedMouseOver(node);
                                    } else {
                                        handleNodeMouseOver(node);
                                    }
                                    setSelectedNodeId(node.id);
                                }
                            }}
                        />
                    ))}
                    {/* 2. PLACE RECTANGLES */}
                    {sortedPlaces.map((place, idx) => {
                        const pos = placePositions[place.name];
                        if (!pos) return null;
                        return (
                            <g
                                key={`place-${idx}`}
                                id={`place-${place.name}`}
                                transform={`translate(${pos.x}, ${pos.y})`}
                                className={'place-rect'}
                                opacity={place.dim ? 0.3 : 1}
                                pointerEvents={place.dim ? 'none': 'auto'}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedPlaceName === place.name) {
                                        clearAllSelections();
                                    } else {
                                        clearAllSelections();
                                        handlePlaceMouseOver(place);
                                        setSelectedPlaceName(place.name);
                                    }
                                }}
                                onMouseEnter={() => handlePlaceHover(place)}
                                onMouseLeave={() => handlePlaceUnhover(place)}
//                                onMouseDown={(e) => {
//                                    draggingPlaceRef.current = place.name;
//                                    isPanningRef.current = false;
//                                    e.stopPropagation();
//                                }}
//                                onClick={() => {
//                                    if (hasDraggedRef.current) return;
//                                    window.location.href = `/location-page/${encodeURIComponent(place.name)}`;
//                                }}
                            >
                                <g className="place-content">
                                    <rect
                                        className="location-box"
                                        x={-65} y={-20}
                                        width={130} height={40}
                                        fill={placeColor(place.type)}
                                        stroke="#DFD6C8"
                                        strokeWidth={2}
                                        rx={8}
                                    />
                                    <foreignObject x={-65} y={-10} width={130} height={20}>
                                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div className="location-text">
                                                {place.name.toUpperCase()}
                                            </div>
                                        </div>
                                    </foreignObject>
                                </g>
                            </g>
                        );
                    })}
                </g>
            </svg>
            {lastDropInfo && (
                <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: '#222', color: '#fff',
                    padding: '6px 10px', borderRadius: 6,
                    fontFamily: 'monospace', fontSize: 12,
                    pointerEvents: 'none'
                }}>
                    {lastDropInfo.name}: lng={lastDropInfo.x}, lat={lastDropInfo.y}
                </div>
            )}
            <div className="translation-outer" id="translation-outer">
                <div className="chapter-poem" id="chapter-poem">
                    <div 
                        className="chapter"
                        id="chapter-display"
                    ></div>
                    <div
                        className="poem"
                        id="poemnum-display"    
                    ></div>
                    {pageUrl && selectedPlaceName && (
                        <button
                            className={styles.characterButton}
                            id="page-button"
                            onClick={() => { window.location.href = pageUrl; }}
                        >
                            View Page
                        </button>
                    )}

                </div>
                <div
                    id="translation-display"
                    className="translation-text"
                ></div>
                <div className="speaker-addressee-mess" id="speaker-addressee-mess">
                    <div 
                        className="speaker-hover"
                        id="speaker-display"
                    ></div>
                    <div
                        className="addressee-hover"
                        id="addressee-display"    
                    ></div>
                    <div
                        className="messenger-hover"
                        id="messenger-display"
                    ></div>
                    {pageUrl && (selectedLinkIdx || selectedNodeId) && (
                        <button
                            className={styles.characterButton}
                            style={{
                                width: '50px'
                            }}
                            id="page-button"
                            onClick={() => { window.location.href = pageUrl; }}
                        >
                            View Page
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}