'use client';

import React, { useState, useEffect, useRef } from "react";
import '../styles/pages/locationMap.css';

export default function CharacterMap({ initialData }) {
    const places = initialData?.places || [];
    const rawPoems = initialData?.poems ? Object.values(initialData.poems) : [];

    const [simulatedNodes, setSimulatedNodes] = useState([]);
    const [simulatedLinks, setSimulatedLinks] = useState([]);
    const [placePositions, setPlacePositions] = useState({});
    const [transform, setTransform] = useState({ x: 475, y: 325, scale: 0.5 });

    const hoveredPnumRef = useRef(null);
    const draggingPlaceRef = useRef(null);
    const isPanningRef = useRef(false);
    const lastMouseRef = useRef({ x: 0, y: 0 });
    const svgRef = useRef(null);
    const dragPositionRef = useRef(null);
    
    // Initialize place positions from database
    useEffect(() => {
        if (places.length > 0) {
            const initial = {};
            places.forEach(place => {
                initial[place.name] = { x: Number(place.lng), y: Number(place.lat) };
            });
            setPlacePositions(initial);
        }
    }, [initialData?.places]);

    // Hover highlight handlers
    const handleMouseOver = (node) => {
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
        const el = document.getElementById('translation-display')
        el.innerHTML = (node.translation || '')
        .replace(/(?!^)([A-Z])/g, '<br>$1');
        if (el) el.textContent = node.translation || '';

        const ch = document.getElementById('chapter-display')
        ch.innerHTML = (`CHAPTER: ${node.chapter}` || '')

        const pn = document.getElementById('poemnum-display')
        pn.innerHTML = (`POEM: ${node.poem}` || '')

        const mess = document.getElementById('messenger-display')
        
        if (mess) mess.innerHTML = (`MESSENGER: ${node.messenger}` || '');

        const sp = document.getElementById('speaker-display')
        if (sp) sp.innerHTML = (`SPEAKER: ${node.speaker}` || '');

        const ad = document.getElementById('addressee-display')
        if (ad) ad.innerHTML = (`ADDRESSEE: ${node.addressee}` || '');
    };

    const handleMouseOut = () => {
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
        const ad = document.getElementById('addressee-display')
        const sp = document.getElementById('speaker-display')
        const mess = document.getElementById('messenger-display')

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
            dragPositionRef.current = null;
        }
        draggingPlaceRef.current = null;
    };

    // Physics simulation
    useEffect(() => {
        if (rawPoems.length === 0 || places.length === 0 || Object.keys(placePositions).length === 0) return;

        let nodes = [];
        let links = [];

        rawPoems.forEach((poem, index) => {
            // 1. Direct, lightning-fast key lookups using your new clean API fields
            const compPlaceName = poem.composition?.placeName;
            const recPlaceName = poem.receipt?.placeName;

            const currentCompPos = compPlaceName ? placePositions[compPlaceName] : null;
            const currentRecPos = recPlaceName ? placePositions[recPlaceName] : null;

            // 2. Derive active coordinates: Use live state position if dragged, fall back to base DB coords if not
            const compX = currentCompPos ? currentCompPos.x : (poem.composition?.lng != null ? Number(poem.composition.lng) : NaN);
            const compY = currentCompPos ? currentCompPos.y : (poem.composition?.lat != null ? Number(poem.composition.lat) : NaN);
            const recX = currentRecPos ? currentRecPos.x : (poem.receipt?.lng != null ? Number(poem.receipt.lng) : NaN);
            const recY = currentRecPos ? currentRecPos.y : (poem.receipt?.lat != null ? Number(poem.receipt.lat) : NaN);
            
            const speaker = poem.composition?.speaker ?? "Unknown Sender";
            const addressee = poem.receipt?.addressee ?? "Unknown Recipient";
            const speakerGender = poem.composition?.speakerGender ?? "Unknown Gender";
            const addresseeGender = poem.receipt?.addresseeGender ?? "Unknown Gender";
            const compId = `${poem.pnum || index}-comp`;
            const recId = `${poem.pnum || index}-rec`;
            const validComp = !isNaN(compX) && !isNaN(compY);
            const validRec = !isNaN(recX) && !isNaN(recY);
            

            if (validComp) {
                nodes.push({
                    id: compId, pnum: poem.pnum, type: 'sender',
                    gender: speakerGender, label: speaker,
                    groupPoems: poem.relationships?.groupPoems || [],
                    replyPoems: poem.relationships?.replyPoems || [],
                    repliesToThis: poem.relationships?.repliesToThis || [],
                    chapter: parseInt(poem.pnum.substring(0, 2)),
                    poem: parseInt(poem.pnum.slice(-2)),
                    translation: poem.composition?.washburn || null,
                    speaker: poem.composition?.speaker ?? "Unknown Sender",
                    addressee: poem.receipt?.addressee ?? "Unknown Recipient",
                    messenger: poem.relationships?.messenger || "none",
                    x: compX, y: compY, homeX: compX, homeY: compY + 6
                });
            }
            if (validRec) {
                nodes.push({
                    id: recId, pnum: poem.pnum, type: 'receiver',
                    gender: addresseeGender, label: addressee,
                    groupPoems: poem.relationships?.groupPoems || [],
                    replyPoems: poem.relationships?.replyPoems || [],
                    repliesToThis: poem.relationships?.repliesToThis || [],
                    chapter: parseInt(poem.pnum.substring(0, 2)),
                    poem: parseInt(poem.pnum.slice(-2)),
                    translation: poem.receipt?.washburn || null,
                    speaker: poem.composition?.speaker ?? "Unknown Sender",
                    addressee: poem.receipt?.addressee ?? "Unknown Recipient",
                    messenger: poem.relationships?.messenger || "none",
                    x: recX, y: recY, homeX: recX, homeY: recY + 6
                });
            }
            if (validComp && validRec) links.push({ sourceId: compId, targetId: recId });
        });

        const iterations = 300;
        const idealNodeDistance = 48;
        const gravityStrength = 0.2;
        const boxWidthBuffer = 85;
        const boxHeightBuffer = 40;
        const linkStrength = 0.1;
        const linkNodes = new Set();
        const nonLinkNodes = new Set();
        const matchLink = [];
        const nonRecNodes = [];

        function snapToPerim(nodeSet) {
            for (let i = 0; i < 100; i++) {
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

        for (let link of links) {
            const sourceNode = nodes.find(n => n.id === link.sourceId);
            const targetNode = nodes.find(n => n.id === link.targetId);
            if (!sourceNode || !targetNode) continue; // Safety condition moved up to prevent array mutations on broken references
            nonRecNodes.push(sourceNode);
            
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            if (dx === 0 && dy === 0) {
                sourceNode.x += (Math.random() - 0.5) * 10;
                sourceNode.y += (Math.random() - 0.5) * 10;
                matchLink.push(link);
                nonLinkNodes.add(sourceNode);
            } else {
                const Xoff = (Math.random()-0.5) * 50;
                const Yoff = (Math.random()-0.5) * 50;
                nonRecNodes.push(targetNode);
                nonRecNodes.push(sourceNode);
                linkNodes.add(sourceNode);
                linkNodes.add(targetNode);
                sourceNode.x += Xoff;
                targetNode.y += Yoff;
                sourceNode.y += Yoff;
                targetNode.x += Xoff;
                sourceNode.x += dx * linkStrength;
                sourceNode.y += dy * linkStrength;
                targetNode.x -= dx * linkStrength;
                targetNode.y -= dy * linkStrength;
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
        console.log(nodes[0])
        setSimulatedNodes(nodes);
        setSimulatedLinks(links);
    }, [initialData?.poems, initialData?.places, placePositions]);

    const placeColor = (type) => {
        if (type === "fictional with evidence") return "#BFAE93";
        if (type === "historical") return "#767D43";
        if (type === "fictional without evidence") return "#EDB940";
        if (type === "projected") return "#CC683D";
        return "#FFF";
    };

    return (
        <div className="map-container">
            <svg
                ref={svgRef}
                width="100%"
                height="625"
                //style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab', display: 'block' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="21" refY="5" markerWidth={6} markerHeight={6} orient="auto-start-reverse">
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
                        </g>
                    }
                    {/* 1. LINKS */}
                    {simulatedLinks.map((link, idx) => {
                        const src = simulatedNodes.find(n => n.id === link.sourceId);
                        const tgt = simulatedNodes.find(n => n.id === link.targetId);
                        if (!src || !tgt) return null;
                        return (
                            <line
                                key={`link-${idx}`}
                                x1={src.x} y1={src.y}
                                x2={tgt.x} y2={tgt.y}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                markerEnd="url(#arrow)"
                                className="connection-line"
                            />
                        );
                    })}

                    {/* Text labels */}
                    {simulatedNodes.map((node, idx) => (
                        <foreignObject key={`label-${idx}`} x={node.x - 23} y={node.y - 46} width={46} height={40}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                textAlign: 'center',
                                lineHeight: '1.1'
                            }}>
                                <span className="poem-node-text" style={{
                                    color: '#fff',
                                    fontSize: '7.5px',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                }}>
                                    {node.label}
                                </span>
                            </div>
                        </foreignObject>
                    ))}

                    {/* Circles */}
                    {simulatedNodes.map((node, idx) => (
                        <circle
                            key={`circle-${idx}`}
                            id={`node-${node.id}`}
                            cx={node.x}
                            cy={node.y}
                            r={6}
                            fill={node.gender === 'female' ? '#B03F2E' : '#9CBAB6'}
                            stroke='#252525'
                            strokeWidth={1.5}
                            style={{ cursor: 'pointer' }}
                            onMouseOver={() => handleMouseOver(node)}
                            onMouseOut={handleMouseOut}
                            onClick={() => window.location.href = `/poems/${node.chapter}/${node.poem}`}
                        />
                    ))}

                    {/* 2. PLACE RECTANGLES */}
                    {places.map((place, idx) => {
                        const pos = placePositions[place.name];
                        if (!pos) return null;
                        return (
                            <g
                                key={`place-${idx}`}
                                id={`place-${place.name}`}   // ← add this
                                transform={`translate(${pos.x}, ${pos.y})`}
                                className='place-rect'
                                onMouseDown={(e) => {
                                    draggingPlaceRef.current = place.name;
                                    isPanningRef.current = false;
                                    e.stopPropagation();
                                }}
                            >
                                <rect
                                    x={-65} y={-20}
                                    width={130} height={40}
                                    fill={placeColor(place.type)}
                                    stroke="#DFD6C8"
                                    strokeWidth={2}
                                    rx={8}
                                />
                                <foreignObject x={-65} y={-10} width={130} height={20}>
                                    <div xmlns="http://www.w3.org/1999/xhtml" className="location-container">
                                        <div className="location-text">
                                            {place.name.toUpperCase()}
                                        </div>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </g>
            </svg>
            <div className="translation-outer">
                <div className="chapter-poem">
                    <div 
                        className="chapter"
                        id="chapter-display"
                    ></div>
                    <div
                        className="poem"
                        id="poemnum-display"    
                    ></div>
                </div>
                <div
                    id="translation-display"
                    className="translation-text"
                ></div>
                <div className="speaker-addressee-mess">
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
                </div>
            </div>
        </div>
    );
}