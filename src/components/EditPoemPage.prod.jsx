import React, { useEffect, useState } from "react";
import { useIsAdmin } from '../hooks/useAuth';
import "../styles/pages/editPoemPage.css";


// Helper: check if value is primitive or array of primitives
function isPrimitiveOrPrimitiveArray(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
    );
  }
  return false;
}

// Helper: clean data by skipping empty, NO_VALUE, or complex objects
function cleanProps(input) {
  const output = {};
  
  // Track tags and otherTags to merge them
  let tags = [];
  let otherTags = [];
  
  for (const [key, val] of Object.entries(input)) {
    if (val === null || val === undefined) continue; // skip null/undefined
    if (typeof val === "string" && val.trim() === "") continue; // skip empty strings
    if (val === "NO_VALUE") continue; // skip placeholders

    // Special handling for tags - collect both tag and otherTags
    if (key === "tag" && Array.isArray(val)) {
      tags = val;
      continue;
    }
    
    if (key === "otherTags" && Array.isArray(val)) {
      otherTags = val;
      continue;
    }

    // Special handling for poetic techniques array
    if (key === "pt" && Array.isArray(val)) {
      output[key] = val;
      continue;
    }

    // Special handling for poetic words array
    if (key === "pw" && Array.isArray(val)) {
      output[key] = val;
      continue;
    }

    // Special handling for reply poems array
    if (key === "replyPoems" && Array.isArray(val)) {
      output[key] = val;
      continue;
    }

    // Special handling for seasonal words/kigo array
    if (key === "kigo" && Array.isArray(val)) {
      output[key] = val;
      continue;
    }

    if (isPrimitiveOrPrimitiveArray(val)) {
      output[key] = val;
    } else {
      console.log(`Skipping invalid prop ${key}:`, val);
    }
  }
  
  // Always merge tags and otherTags into a single tag field for backend
  // Even if one of them is empty, we need to send the complete merged list
  const mergedTags = [...tags, ...otherTags];
  output.tag = mergedTags; // Always include tag field, even if empty
  
  return output;
}

// Fetch poem data
async function fetchPoemData(chapter, number) {
    const res = await fetch(`/api/poems?chapter=${chapter}&&number=${number}`);
    if (!res.ok) throw new Error("Failed to fetch poem data");
    return res.json();
}

// Update poem data
async function updatePoemData(pnum, updatedData) {
    const res = await fetch(`/api/poems/edit_poem?pnum=${pnum}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
    });
    if (!res.ok) throw new Error("Failed to update poem data");
    return res.json();
}

// Order of fields to render - updated to match actual data structure
const fieldOrder = [
  "speaker", "addressee", "poemId", "age", "JPRM_Japanese", "JPRM_Romaji",
  "Waley", "Seidensticker", "Tyler", "Washburn", "Cranston",
  "narrativeContext", "paraphrase", "notes", "paperMediumType", "deliveryStyle",
  "season", "season_evidence", "spoken", "written", "spoken_or_written_evidence", 
  "pt", "tag", "otherTags", "placeOfComp", "placeOfComp_evidence",
  "placeOfReceipt", "placeOfReceipt_evidence",
  "pw", "messenger", "replyPoems",
  "proxy", "kigo", "handwritingDescription", 
];

// "repCharacter", "source?", (This refers to Honka nodes in Neo4j)
// "groupPoems", "furtherReadings (utilizes source, don't need this source atm?)", (Difficult to implement group as many poems are related by unique group node)
// Also kinda difficult "relWithEvidence", internal allusions, Genji Poem -- Genji Poem with evidence

export default function EditPoemPage({ chapter, poemNum }) {
    const { isAdmin, isLoading } = useIsAdmin();
    const [showButton, setShowButton] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [poemData, setPoemData] = useState(null);
    const [editData, setEditData] = useState(null);
    const [error, setError] = useState(null);
    const [availablePlaces, setAvailablePlaces] = useState([]);
    const [availablePoeticWords, setAvailablePoeticWords] = useState([]);
    const [availableSeasonalWords, setAvailableSeasonalWords] = useState([]);
    const [availableCharacters, setAvailableCharacters] = useState([]);
    const number = poemNum.toString().padStart(2, '0');

    // Check if user is admin based on session
    useEffect(() => {
        if (isLoading) return; // Wait for session to load
        setShowButton(isAdmin);
    }, [isAdmin, isLoading]);

    // Fetch available places when popup opens
    useEffect(() => {
        if (showPopup && availablePlaces.length === 0) {
            fetch('/api/poems/edit_places')
                .then(res => res.json())
                .then(places => {
                    setAvailablePlaces(places);
                })
                .catch(err => {
                    console.error('Error loading places:', err);
                    setAvailablePlaces([]);
                });
        }
    }, [showPopup, availablePlaces.length]);

    // Fetch available poetic words when popup opens
    useEffect(() => {
        if (showPopup && availablePoeticWords.length === 0) {
            fetch('/api/poems/edit_poeticWords')
                .then(res => res.json())
                .then(poeticWords => {
                    setAvailablePoeticWords(poeticWords);
                })
                .catch(err => {
                    console.error('Error loading poetic words:', err);
                    setAvailablePoeticWords([]);
                });
        }
    }, [showPopup, availablePoeticWords.length]);

    // Fetch available seasonal words when popup opens
    useEffect(() => {
        if (showPopup && availableSeasonalWords.length === 0) {
            fetch('/api/poems/edit_seasonalWords')
                .then(res => res.json())
                .then(seasonalWords => {
                    setAvailableSeasonalWords(seasonalWords);
                })
                .catch(err => {
                    console.error('Error loading seasonal words:', err);
                    setAvailableSeasonalWords([]);
                });
        }
    }, [showPopup, availableSeasonalWords.length]);

    // Fetch available characters when popup opens
    useEffect(() => {
        if (showPopup && availableCharacters.length === 0) {
            fetch('/api/poems/edit_characters')
                .then(res => res.json())
                .then(characters => {
                    setAvailableCharacters(characters);
                })
                .catch(err => {
                    console.error('Error loading characters:', err);
                    setAvailableCharacters([]);
                });
        }
    }, [showPopup, availableCharacters.length]);

    useEffect(() => {
        if (showPopup && !poemData) {
            setLoading(true);
            fetchPoemData(chapter, number)
                .then((responseData) => {
                    const exchange = responseData[0];
                    const transTemp = responseData[1];
                    const sources = responseData[2];
                    const relatedWithEvidence = responseData[3];
                    const tags = responseData[4];
                    const pls = responseData[6];

                    let speaker = [...new Set(exchange.map(e => e.start.properties.name))];
                    let addressee = [...new Set(exchange.map(e => e.end.properties.name))];
                    
                    let src_obj = [];
                    let index = 0;
                    let entered_honka = [];

                    sources.forEach(e => {
                        if (entered_honka.includes(e[0])) {
                            src_obj[src_obj.findIndex(el => el.honka === e[0])].translation.push([e[5], e[6]]);
                        } else {
                            src_obj.push({
                                id: index,
                                honka: e[0],
                                source: e[1],
                                romaji: e[2],
                                poet: e[3],
                                order: e[4],
                                translation: [[e[5], e[6]]],
                                notes: e[7]
                            });
                            entered_honka.push(e[0]);
                            index++;
                        }
                    });

                    let poemId = pls?.[0] ? Object.values(pls[0])[0] : null;

                    // Initialize all to empty string
                    let waley = "";
                    let seidensticker = "";
                    let tyler = "";
                    let washburn = "";
                    let cranston = "";

                    // Map incoming translation array from Neo4j
                    transTemp.forEach(e => {
                    const translatorName = e[0];
                    const text = e[1]; // assuming e[1] is the actual translation text
                    switch (translatorName) {
                        case "Waley": waley = text; break;
                        case "Seidensticker": seidensticker = text; break;
                        case "Tyler": tyler = text; break;
                        case "Washburn": washburn = text; break;
                        case "Cranston": cranston = text; break;
                        default: break;
                    }
                    });

                    const jprmJapanese = exchange[0]?.segments[0]?.end?.properties?.Japanese || "";
                    const jprmRomaji = exchange[0]?.segments[0]?.end?.properties?.Romaji || "";

                    // Separate tags into regular poem types and other tags
                    const poemTypes = ["Proffered Poem", "Reply Poem", "Soliloquy", "Group Poem"];
                    const otherTagTypes = ["Chapter Title Poem", "Character Name Poem", "Bad Poems", "Proxy Poem", "Morning After Poem", "Omitted by Seidensticker"];
                    
                    let regularTags = [];
                    let separatedOtherTags = [];
                    
                    if (Array.isArray(tags)) {
                        tags.forEach(([tagName, isSelected]) => {
                            if (isSelected) {
                                if (poemTypes.includes(tagName)) {
                                    regularTags.push([tagName, true]);
                                } else if (otherTagTypes.includes(tagName)) {
                                    separatedOtherTags.push(tagName);
                                }
                            }
                        });
                    }

                    // Build state with translators as separate fields
                    const newPoemState = {
                    speaker,
                    addressee,
                    JPRM_Japanese: jprmJapanese, // keep as string with \n
                    JPRM_Romaji: jprmRomaji,
                    Waley: waley,
                    Seidensticker: seidensticker,
                    Tyler: tyler,
                    Washburn: washburn,
                    Cranston: cranston,
                    source: src_obj,
                    relWithEvidence: relatedWithEvidence,
                    tag: regularTags,
                    otherTags: separatedOtherTags,
                    notes: exchange[0]?.segments[0]?.end?.properties?.notes,
                    poemId,
                    narrativeContext: responseData[7],
                    paraphrase: responseData[8],
                    handwritingDescription: responseData[9],
                    paperMediumType: responseData[10],
                    deliveryStyle: responseData[11],
                    season: responseData[12],
                    kigo: responseData[13],
                    pt: responseData[14],
                    pw: responseData[15],
                    proxy: responseData[16],
                    messenger: responseData[17],
                    age: responseData[18],
                    repCharacter: responseData[19],
                    placeOfComp: responseData[20],
                    placeOfReceipt: responseData[21],
                    spoken: responseData[22],
                    written: responseData[23],
                    season_evidence: responseData[24],
                    placeOfComp_evidence: responseData[25],
                    placeOfReceipt_evidence: responseData[26],
                    groupPoems: responseData[27],
                    replyPoems: responseData[28],
                    furtherReadings: responseData[29],
                    spoken_or_written_evidence: responseData[30]
                    };

                    // Fixed serialization logic
                    const serialized = {};
                    Object.entries(newPoemState).forEach(([key, val]) => {
                        if (val === null || val === undefined) {
                            serialized[key] = "";
                        } else if (key === "pt") {
                            // Special handling for poetic techniques - ensure it's always a valid JSON array
                            if (Array.isArray(val)) {
                                serialized[key] = JSON.stringify(val);
                            } else {
                                serialized[key] = JSON.stringify([]);
                            }
                        } else if (key === "pw") {
                            // Special handling for poetic words - serialize as JSON
                            if (Array.isArray(val)) {
                                serialized[key] = JSON.stringify(val);
                            } else {
                                serialized[key] = JSON.stringify([]);
                            }
                        } else if (key === "tag") {
                            // Special handling for poem types/tags - convert from backend format to frontend format
                            if (Array.isArray(val)) {
                                // Backend returns format like [["Proffered", true], ["Reply", true]]
                                // Convert to just the selected tag names for frontend: ["Proffered", "Reply"]
                                const selectedTags = val.filter(([name, selected]) => selected).map(([name]) => name);
                                serialized[key] = JSON.stringify(selectedTags);
                            } else {
                                serialized[key] = JSON.stringify([]);
                            }
                        } else if (key === "otherTags") {
                            // Special handling for other tags - serialize as JSON array
                            if (Array.isArray(val)) {
                                serialized[key] = JSON.stringify(val);
                            } else {
                                serialized[key] = JSON.stringify([]);
                            }
                        } else if (key === "replyPoems") {
                            // Special handling for replyPoems - serialize as JSON
                            if (Array.isArray(val)) {
                                serialized[key] = JSON.stringify(val);
                            } else {
                                serialized[key] = JSON.stringify([]);
                            }
                        } else if (key === "kigo") {
                            // Special handling for seasonal words/kigo - serialize as JSON
                            if (Array.isArray(val)) {
                                serialized[key] = JSON.stringify(val);
                            } else {
                                serialized[key] = JSON.stringify([]);
                            }
                        } else if (typeof val === "object") {
                            serialized[key] = JSON.stringify(val, null, 2);
                        } else {
                            serialized[key] = val.toString();
                        }
                    });

                    setPoemData(serialized);
                    setEditData({ ...serialized });
                })
                .catch((e) => {
                    console.error("Error fetching poem data:", e);
                    setError(e.message);
                })
                .finally(() => setLoading(false));
        }
    }, [showPopup, poemData, chapter, number]);

    function prepareForSave(data) {
        const result = {};

        // Recombine JPRM fields into array for backend
        if (data.JPRM_Japanese !== undefined || data.JPRM_Romaji !== undefined) {
            result.JPRM = [
            data.JPRM_Japanese || null,
            data.JPRM_Romaji || null
            ];
        }

        for (let key of fieldOrder) {
            if (key === "JPRM_Japanese" || key === "JPRM_Romaji") continue;

            const val = data[key];
            if (!val || val === "") {
            result[key] = null;
            continue;
            }

            if (key === "spoken" || key === "written") {
                // Accept only "true" or "false" string on save; fallback to "false"
                const valLower = val.toLowerCase();
                result[key] = valLower === "true" ? "true" : "false";
            } else if (key === "season") {
                // Handle season as a simple string value - backend will create the relationship
                result[key] = val;
            } else if (key === "pt") {
                // Special handling for poetic techniques - ensure it's properly parsed
                try {
                    if (!val || val.trim() === "") {
                        result[key] = [];
                    } else {
                        const parsed = JSON.parse(val);
                        result[key] = parsed;
                    }
                } catch {
                    result[key] = [];
                }
            } else if (key === "tag") {
                // Special handling for poem types/tags - ensure it's properly parsed
                try {
                    if (!val || val.trim() === "") {
                        result[key] = [];
                    } else {
                        const parsed = JSON.parse(val);
                        result[key] = parsed;
                    }
                } catch {
                    result[key] = [];
                }
            } else if (key === "otherTags") {
                // Special handling for other tags - ensure it's properly parsed
                try {
                    if (!val || val.trim() === "") {
                        result[key] = [];
                    } else {
                        const parsed = JSON.parse(val);
                        result[key] = parsed;
                    }
                } catch {
                    result[key] = [];
                }
            } else if (key === "pw") {
                // Special handling for poetic words - ensure it's properly parsed
                try {
                    if (!val || val.trim() === "") {
                        result[key] = [];
                    } else {
                        const parsed = JSON.parse(val);
                        result[key] = parsed;
                    }
                } catch {
                    result[key] = [];
                }
            } else if (key === "replyPoems") {
                // Special handling for reply poems - ensure it's properly parsed
                try {
                    if (!val || val.trim() === "") {
                        result[key] = [];
                    } else {
                        const parsed = JSON.parse(val);
                        result[key] = parsed;
                    }
                } catch {
                    result[key] = [];
                }
            } else if (key === "kigo") {
                // Special handling for seasonal words/kigo - ensure it's properly parsed
                try {
                    if (!val || val.trim() === "") {
                        result[key] = [];
                    } else {
                        const parsed = JSON.parse(val);
                        result[key] = parsed;
                    }
                } catch {
                    result[key] = [];
                }
            } else {
            try {
                result[key] = JSON.parse(val);
            } catch {
                result[key] = val;
            }
            }
        }

        return result;
    }


    async function handleSave() {
        setLoading(true);
        setError(null);
        try {
            const prepared = prepareForSave(editData);

            // CLEAN the prepared data here before sending:
            const cleaned = cleanProps(prepared);

            // Use poemId from state for pnum
            const pnum = editData?.poemId || poemData?.poemId;
            if (!pnum) {
                throw new Error("Poem ID (pnum) is not available for saving.");
            }

            await updatePoemData(pnum, cleaned);

            setPoemData({ ...editData });
            setShowPopup(false);
        } catch (e) {
            console.error("Error saving poem data:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function handleCancel() {
        setEditData({ ...poemData });
        setShowPopup(false);
    }

    async function handleDelete(key) {
        const confirmDelete = window.confirm(`Delete field "${key}"?`);
        if (!confirmDelete) return;

        // Map local key to backend field name expected by API
        const fieldMap = {
            spoken: "Spoken",
            written: "Written",
            season: "season", // season maps directly
            narrativeContext: "narrative_context",
            paraphrase: "paraphrase",
            notes: "notes",
            paperMediumType: "paper_or_medium_type",
            deliveryStyle: "delivery_style",
            season_evidence: "season_evidence",
            spoken_or_written_evidence: "evidence_for_spoken_or_written",
            pt: "pt", // poetic techniques map directly
            tag: "tag", // poem types/tags map directly
            otherTags: "otherTags", // other tags have separate handling
            placeOfComp: "placeOfComp", // place of composition maps directly
            placeOfReceipt: "placeOfReceipt", // place of receipt maps directly
            placeOfComp_evidence: "placeOfComp_evidence",
            placeOfReceipt_evidence: "placeOfReceipt_evidence",
            messenger: "messenger", // messenger maps directly
            proxy: "proxy", // proxy maps directly
            replyPoems: "replyPoems", // reply poems map directly
            kigo: "kigo", // seasonal words/kigo map directly
            handwritingDescription: "handwriting_description", // handwriting description maps directly
        };
        const fieldToDelete = fieldMap[key] || key;

        try {
            const res = await fetch(`/api/poems/edit_poem?pnum=${encodeURIComponent(editData.poemId)}&field=${encodeURIComponent(fieldToDelete)}`, {
            method: "DELETE",
            });

            if (!res.ok) {
            const err = await res.json();
            alert(`Error: ${err.error}`);
            return;
            }

            // Remove field from local state
            setEditData((prev) => {
            const updated = { ...prev };
            
            // Special handling for poetic techniques, tags, and reply poems - set to empty array instead of deleting
            if (key === "pt") {
                updated[key] = JSON.stringify([]);
            } else if (key === "tag") {
                updated[key] = JSON.stringify([]);
            } else if (key === "otherTags") {
                updated[key] = JSON.stringify([]);
            } else if (key === "replyPoems") {
                updated[key] = JSON.stringify([]);
            } else {
                delete updated[key];
            }
            
            return updated;
            });

        } catch (error) {
            console.error("Error deleting field:", error);
            alert(`Error: ${error.message}`);
        }
    }


    // Helper function to format field names
    function formatFieldName(key) {
        // Handle specific field name mappings first
        if (key === 'notes') return 'Commentary';
        if (key === 'narrativeContext') return 'Where We Are In The Tale';
        if (key === 'paraphrase') return 'What The Poem Is Saying';
        if (key === 'tag') return 'Poem Type';
        if (key === 'otherTags') return 'Other Tags';
        if (key === 'replyPoems') return 'Reply Poems';
        if (key === 'proxy') return 'Proxy Poet';
        if (key === 'kigo') return 'Seasonal Words';
        if (key === 'handwritingDescription') return 'Handwriting Description';
        
        return key
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
            .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize each word
            .replace(/J P R M/g, 'JPRM') // Fix acronym
            .replace(/Rel With Evidence/g, 'Related With Evidence')
            .replace(/Rep Character/g, 'Representative Character')
            .replace(/Place Of Comp/g, 'Place Of Composition')
            .replace(/Place Of Receipt/g, 'Place Of Receipt')
            .replace(/Pt/g, 'Poetic Techniques')
            .replace(/Pw/g, 'Poetic Words');
    }

    function renderFields() {
        if (!editData) return null;

        const compactFields = [
            "speaker",
            "addressee",
            "poemId",
            "season",
            "age",
            "spoken",
            "written",
        ];

        const readOnlyFields = ["speaker", "addressee", "poemId", "age"];

        const seasonHint = "Possible values: Spring, Summer, Autumn, Winter";

        const booleanHint = 'Possible value: lowercase "true" or "false"';

        const compactItems = compactFields.map((key) => {
            const isReadOnly = readOnlyFields.includes(key);

            // For spoken and written, ensure value is either "true" or "false"
            let inputValue = editData[key] ?? "";

            inputValue = editData[key] ?? "";

            return (
            <div key={key} className="compact-field-container">
                <label
                className="compact-field-label"
                style={{ display: "flex", alignItems: "center" }}
                >
                {formatFieldName(key)}

                {(key === "spoken" || key === "written") && (
                    <span
                    title={booleanHint}
                    style={{
                        marginLeft: "0.3rem",
                        cursor: "help",
                        color: "#888",
                        fontWeight: "bold",
                    }}
                    >
                    ?
                    </span>
                )}

                {key === "season" && (
                    <span
                    title={seasonHint}
                    style={{
                        marginLeft: "0.3rem",
                        cursor: "help",
                        color: "#888",
                        fontWeight: "bold",
                    }}
                    >
                    ?
                    </span>
                )}

                {!isReadOnly && (
                    <button
                    type="button"
                    className="delete-button"
                    aria-label={`Delete field ${formatFieldName(key)}`}
                    onClick={() => handleDelete(key)}
                    title="Clear field"
                    style={{
                        marginLeft: "0.5rem",
                        color: "red",
                        cursor: "pointer",
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        fontSize: "1rem",
                        lineHeight: 1,
                    }}
                    >
                    ❌
                    </button>
                )}
                </label>
                <input
                    type="text"
                    className="compact-field-input"
                    value={inputValue}
                    readOnly={isReadOnly}
                    style={isReadOnly ? { backgroundColor: "#f5f5f5" } : {}}
                    onChange={(e) => {
                        if (isReadOnly) return;

                        let newValue = e.target.value;
                        
                        // For spoken/written, convert to lowercase
                        if (key === "spoken" || key === "written") {
                            newValue = newValue.toLowerCase();
                        }
                        // For season, capitalize first letter to match Season node names
                        else if (key === "season") {
                            newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1).toLowerCase();
                        }
                        
                        setEditData((prev) => ({ ...prev, [key]: newValue }));
                    }}
                />
            </div>
            );
        });

        const fullFields = fieldOrder.filter((key) => !compactFields.includes(key));

        return (
            <div className="fields-container">
                <div className="compact-fields-grid">
                    {compactItems}
                </div>

                {fullFields.map((key) => {
                    // Special handling for poetic techniques
                    if (key === "pt") {
                        const poeticTechniques = ["kakekotoba", "engo", "utamakura", "makurakotoba"];
                        
                        // Parse current pt data - handle both array and JSON string formats
                        let currentTechniques = [];
                        try {
                            let ptData = editData[key];
                            if (typeof ptData === 'string' && ptData.trim() !== '') {
                                ptData = JSON.parse(ptData);
                            } else if (typeof ptData === 'string' && ptData.trim() === '') {
                                ptData = [];
                            }
                            if (Array.isArray(ptData)) {
                                currentTechniques = ptData.filter(([name, selected]) => selected).map(([name]) => name);
                            }
                        } catch (e) {
                            currentTechniques = [];
                        }

                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                </label>
                                <div className="full-input-wrapper">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", minHeight: "120px", backgroundColor: "#fafafa" }}>
                                        {poeticTechniques.map((technique) => (
                                            <label key={technique} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "4px 0" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={currentTechniques.includes(technique)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        let newTechniques = [...currentTechniques]; // Create a copy
                                                        
                                                        if (isChecked) {
                                                            if (!newTechniques.includes(technique)) {
                                                                newTechniques.push(technique);
                                                            }
                                                        } else {
                                                            newTechniques = newTechniques.filter(t => t !== technique);
                                                        }
                                                        
                                                        // Convert to the expected format: all techniques with boolean values
                                                        const ptData = poeticTechniques.map(tech => [tech, newTechniques.includes(tech)]);
                                                        
                                                        setEditData((prev) => ({
                                                            ...prev,
                                                            [key]: JSON.stringify(ptData)
                                                        }));
                                                    }}
                                                    style={{ transform: "scale(1.2)" }}
                                                />
                                                <span style={{ textTransform: "capitalize", fontSize: "14px", fontWeight: "500" }}>{technique}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear all poetic techniques"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for poem types/tags
                    if (key === "tag") {
                        const poemTypes = ["Proffered Poem", "Reply Poem", "Soliloquy", "Group Poem"];
                        
                        // Parse current tag data - handle both array and JSON string formats
                        let currentTypes = [];
                        try {
                            let tagData = editData[key];
                            if (typeof tagData === 'string' && tagData.trim() !== '') {
                                // Try to parse as JSON first, fallback to comma-separated
                                if (tagData.includes('[')) {
                                    tagData = JSON.parse(tagData);
                                } else {
                                    tagData = tagData.split(',').map(item => item.trim()).filter(item => item);
                                }
                            } else if (typeof tagData === 'string' && tagData.trim() === '') {
                                tagData = [];
                            }
                            if (Array.isArray(tagData)) {
                                currentTypes = tagData;
                            }
                        } catch (e) {
                            currentTypes = [];
                        }

                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                </label>
                                <div className="full-input-wrapper">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", minHeight: "120px", backgroundColor: "#fafafa" }}>
                                        {poemTypes.map((poemType) => (
                                            <label key={poemType} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "4px 0" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={currentTypes.includes(poemType)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        let newTypes = [...currentTypes]; // Create a copy
                                                        
                                                        if (isChecked) {
                                                            if (!newTypes.includes(poemType)) {
                                                                newTypes.push(poemType);
                                                            }
                                                        } else {
                                                            newTypes = newTypes.filter(t => t !== poemType);
                                                        }
                                                        
                                                        setEditData((prev) => ({
                                                            ...prev,
                                                            [key]: JSON.stringify(newTypes)
                                                        }));
                                                    }}
                                                    style={{ transform: "scale(1.2)" }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "500" }}>{poemType}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear all poem types"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for other tags
                    if (key === "otherTags") {
                        const otherTagTypes = ["Chapter Title Poem", "Character Name Poem", "Bad Poems", "Proxy Poem", "Morning After Poem", "Omitted by Seidensticker"];
                        
                        // Parse current other tag data - handle both array and JSON string formats
                        let currentOtherTypes = [];
                        try {
                            let tagData = editData[key];
                            if (typeof tagData === 'string' && tagData.trim() !== '') {
                                // Try to parse as JSON first, fallback to comma-separated
                                if (tagData.includes('[')) {
                                    tagData = JSON.parse(tagData);
                                } else {
                                    tagData = tagData.split(',').map(item => item.trim()).filter(item => item);
                                }
                            } else if (typeof tagData === 'string' && tagData.trim() === '') {
                                tagData = [];
                            }
                            if (Array.isArray(tagData)) {
                                currentOtherTypes = tagData;
                            }
                        } catch (e) {
                            currentOtherTypes = [];
                        }

                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                </label>
                                <div className="full-input-wrapper">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", minHeight: "120px", backgroundColor: "#fafafa" }}>
                                        {otherTagTypes.map((tagType) => (
                                            <label key={tagType} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "4px 0" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={currentOtherTypes.includes(tagType)}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        let newTypes = [...currentOtherTypes]; // Create a copy
                                                        
                                                        if (isChecked) {
                                                            if (!newTypes.includes(tagType)) {
                                                                newTypes.push(tagType);
                                                            }
                                                        } else {
                                                            newTypes = newTypes.filter(t => t !== tagType);
                                                        }
                                                        
                                                        setEditData((prev) => ({
                                                            ...prev,
                                                            [key]: JSON.stringify(newTypes)
                                                        }));
                                                    }}
                                                    style={{ transform: "scale(1.2)" }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: "500" }}>{tagType}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear all other tags"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for poetic words (pw)
                    if (key === "pw") {
                        let currentPoeticWords = [];
                        try {
                            let pwData = editData[key];
                            if (typeof pwData === 'string') {
                                pwData = JSON.parse(pwData);
                            } else if (typeof pwData === 'undefined' || pwData === null) {
                                pwData = [];
                            } else if (typeof pwData === 'string' && pwData.trim() === '') {
                                pwData = [];
                            }
                            if (Array.isArray(pwData)) {
                                currentPoeticWords = pwData;
                            }
                        } catch (e) {
                            currentPoeticWords = [];
                        }

                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    Poetic Words
                                    <span style={{ fontSize: "12px", fontWeight: "normal", color: "#666", marginLeft: "8px" }}>
                                        Select from existing poetic words or create new ones
                                    </span>
                                </label>
                                <div className="full-input-wrapper">
                                    <div style={{ 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: "16px", 
                                        padding: "16px", 
                                        border: "1px solid #ddd", 
                                        borderRadius: "8px", 
                                        backgroundColor: "#f9f9f9",
                                        width: "100%",
                                        maxWidth: "900px"
                                    }}>
                                        {currentPoeticWords.map((poeticWord, index) => (
                                            <div key={index} style={{ 
                                                display: "flex", 
                                                flexDirection: "column", 
                                                gap: "12px", 
                                                padding: "16px", 
                                                backgroundColor: "white",
                                                borderRadius: "6px",
                                                border: "1px solid #ccc"
                                            }}>
                                                <div style={{ alignSelf: "flex-start" }}>
                                                    <label style={{ 
                                                        display: "block", 
                                                        fontSize: "13px", 
                                                        fontWeight: "bold", 
                                                        color: "#333", 
                                                        marginBottom: "4px" 
                                                    }}>
                                                        Name (必須 / Required):
                                                    </label>
                                                    <input
                                                        type="text"
                                                        list="poetic-word-names"
                                                        placeholder="Type or select poetic word name (e.g., Miyagino)"
                                                        value={poeticWord.name || ""}
                                                        onChange={(e) => {
                                                            const selectedName = e.target.value;
                                                            const selectedWord = availablePoeticWords.find(pw => pw.name === selectedName);
                                                            
                                                            const newPoeticWords = [...currentPoeticWords];
                                                            if (selectedWord) {
                                                                // Auto-fill all fields when a name is selected
                                                                newPoeticWords[index] = {
                                                                    name: selectedWord.name || "",
                                                                    kanji_hiragana: selectedWord.kanji_hiragana || "",
                                                                    english_equiv: selectedWord.english_equiv || "",
                                                                    gloss: selectedWord.gloss || ""
                                                                };
                                                            } else {
                                                                // Manual typing
                                                                newPoeticWords[index] = {
                                                                    ...poeticWord,
                                                                    name: selectedName
                                                                };
                                                            }
                                                            
                                                            setEditData((prev) => ({
                                                                ...prev,
                                                                [key]: JSON.stringify(newPoeticWords)
                                                            }));
                                                        }}
                                                        style={{
                                                            padding: "8px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                            fontSize: "14px",
                                                            width: "400px",
                                                            fontFamily: "inherit"
                                                        }}
                                                    />
                                                </div>
                                                
                                                <div style={{ display: "grid", gridTemplateColumns: "300px 300px", gap: "24px" }}>
                                                    <div>
                                                        <label style={{ 
                                                            display: "block", 
                                                            fontSize: "13px", 
                                                            fontWeight: "bold", 
                                                            color: "#333", 
                                                            marginBottom: "4px" 
                                                        }}>
                                                            Kanji/Hiragana:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., 宮城野（みやぎの）"
                                                            value={poeticWord.kanji_hiragana || ""}
                                                            onChange={(e) => {
                                                                const newPoeticWords = [...currentPoeticWords];
                                                                newPoeticWords[index] = {
                                                                    ...poeticWord,
                                                                    kanji_hiragana: e.target.value
                                                                };
                                                                setEditData((prev) => ({
                                                                    ...prev,
                                                                    [key]: JSON.stringify(newPoeticWords)
                                                                }));
                                                            }}
                                                            style={{
                                                                padding: "8px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "4px",
                                                                fontSize: "14px",
                                                                width: "100%",
                                                                fontFamily: "inherit"
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label style={{ 
                                                            display: "block", 
                                                            fontSize: "13px", 
                                                            fontWeight: "bold", 
                                                            color: "#333", 
                                                            marginBottom: "4px" 
                                                        }}>
                                                            English Equivalent:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Miyagi Moor"
                                                            value={poeticWord.english_equiv || ""}
                                                            onChange={(e) => {
                                                                const newPoeticWords = [...currentPoeticWords];
                                                                newPoeticWords[index] = {
                                                                    ...poeticWord,
                                                                    english_equiv: e.target.value
                                                                };
                                                                setEditData((prev) => ({
                                                                    ...prev,
                                                                    [key]: JSON.stringify(newPoeticWords)
                                                                }));
                                                            }}
                                                            style={{
                                                                padding: "8px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "4px",
                                                                fontSize: "14px",
                                                                width: "100%",
                                                                fontFamily: "inherit"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div style={{ maxWidth: "700px" }}>
                                                    <label style={{ 
                                                        display: "block", 
                                                        fontSize: "13px", 
                                                        fontWeight: "bold", 
                                                        color: "#333", 
                                                        marginBottom: "4px" 
                                                    }}>
                                                        Gloss (Detailed Description):
                                                    </label>
                                                    <textarea
                                                        placeholder="Enter detailed description, literary associations, poetic sources, etc."
                                                        value={poeticWord.gloss || ""}
                                                        onChange={(e) => {
                                                            const newPoeticWords = [...currentPoeticWords];
                                                            newPoeticWords[index] = {
                                                                ...poeticWord,
                                                                gloss: e.target.value
                                                            };
                                                            setEditData((prev) => ({
                                                                ...prev,
                                                                [key]: JSON.stringify(newPoeticWords)
                                                            }));
                                                        }}
                                                        style={{
                                                            padding: "8px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                            fontSize: "14px",
                                                            width: "100%",
                                                            minHeight: "80px",
                                                            resize: "vertical",
                                                            fontFamily: "inherit",
                                                            lineHeight: "1.4"
                                                        }}
                                                    />
                                                </div>
                                                
                                                <button
                                                    onClick={() => {
                                                        const newPoeticWords = currentPoeticWords.filter((_, i) => i !== index);
                                                        setEditData((prev) => ({
                                                            ...prev,
                                                            [key]: JSON.stringify(newPoeticWords)
                                                        }));
                                                    }}
                                                    style={{
                                                        padding: "6px 12px",
                                                        backgroundColor: "#dc3545",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        alignSelf: "flex-start"
                                                    }}
                                                >
                                                    Remove This Poetic Word
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <button
                                            onClick={() => {
                                                const newPoeticWords = [...currentPoeticWords, { name: "", kanji_hiragana: "", english_equiv: "", gloss: "" }];
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    [key]: JSON.stringify(newPoeticWords)
                                                }));
                                            }}
                                            style={{
                                                padding: "10px 16px",
                                                backgroundColor: "#007cba",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "bold",
                                                alignSelf: "flex-start"
                                            }}
                                        >
                                            ＋ Add New Poetic Word
                                        </button>
                                        
                                        <datalist id="poetic-word-names">
                                            {availablePoeticWords.map((pw) => (
                                                <option key={pw.name} value={pw.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear all poetic words"
                                        style={{ marginTop: "12px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for seasonal words/kigo (kigo)
                    if (key === "kigo") {
                        let currentSeasonalWords = [];
                        try {
                            let kigoData = editData[key];
                            if (typeof kigoData === 'string') {
                                kigoData = JSON.parse(kigoData);
                            } else if (typeof kigoData === 'undefined' || kigoData === null) {
                                kigoData = [];
                            } else if (typeof kigoData === 'string' && kigoData.trim() === '') {
                                kigoData = [];
                            }
                            if (Array.isArray(kigoData)) {
                                currentSeasonalWords = kigoData;
                            }
                        } catch (e) {
                            currentSeasonalWords = [];
                        }

                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    Seasonal Words (Kigo)
                                    <span style={{ fontSize: "12px", fontWeight: "normal", color: "#666", marginLeft: "8px" }}>
                                        Select from existing seasonal words or create new ones
                                    </span>
                                </label>
                                <div className="full-input-wrapper">
                                    <div style={{ 
                                        display: "flex", 
                                        flexDirection: "column", 
                                        gap: "16px", 
                                        padding: "16px", 
                                        border: "1px solid #ddd", 
                                        borderRadius: "8px", 
                                        backgroundColor: "#f9f9f9",
                                        width: "100%",
                                        maxWidth: "900px"
                                    }}>
                                        {currentSeasonalWords.map((seasonalWord, index) => (
                                            <div key={index} style={{ 
                                                display: "flex", 
                                                flexDirection: "column", 
                                                gap: "12px", 
                                                padding: "16px", 
                                                backgroundColor: "white",
                                                borderRadius: "6px",
                                                border: "1px solid #ccc"
                                            }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "400px 400px", gap: "24px" }}>
                                                    <div>
                                                        <label style={{ 
                                                            display: "block", 
                                                            fontSize: "13px", 
                                                            fontWeight: "bold", 
                                                            color: "#333", 
                                                            marginBottom: "4px" 
                                                        }}>
                                                            English (必須 / Required):
                                                        </label>
                                                        <input
                                                            type="text"
                                                            list="seasonal-word-english"
                                                            placeholder="Type or select English name (e.g., tender lilac stems)"
                                                            value={seasonalWord.english || ""}
                                                            onChange={(e) => {
                                                                const selectedEnglish = e.target.value;
                                                                const selectedWord = availableSeasonalWords.find(sw => sw.english === selectedEnglish);
                                                                
                                                                const newSeasonalWords = [...currentSeasonalWords];
                                                                if (selectedWord) {
                                                                    // Auto-fill all fields when an English name is selected
                                                                    newSeasonalWords[index] = {
                                                                        english: selectedWord.english || "",
                                                                        japanese: selectedWord.japanese || "",
                                                                        evidence: seasonalWord.evidence || ""
                                                                    };
                                                                } else {
                                                                    // Manual typing
                                                                    newSeasonalWords[index] = {
                                                                        ...seasonalWord,
                                                                        english: selectedEnglish
                                                                    };
                                                                }
                                                                
                                                                setEditData((prev) => ({
                                                                    ...prev,
                                                                    [key]: JSON.stringify(newSeasonalWords)
                                                                }));
                                                            }}
                                                            style={{
                                                                padding: "8px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "4px",
                                                                fontSize: "14px",
                                                                width: "100%",
                                                                fontFamily: "inherit"
                                                            }}
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label style={{ 
                                                            display: "block", 
                                                            fontSize: "13px", 
                                                            fontWeight: "bold", 
                                                            color: "#333", 
                                                            marginBottom: "4px" 
                                                        }}>
                                                            Japanese:
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., 小萩"
                                                            value={seasonalWord.japanese || ""}
                                                            onChange={(e) => {
                                                                const newSeasonalWords = [...currentSeasonalWords];
                                                                newSeasonalWords[index] = {
                                                                    ...seasonalWord,
                                                                    japanese: e.target.value
                                                                };
                                                                setEditData((prev) => ({
                                                                    ...prev,
                                                                    [key]: JSON.stringify(newSeasonalWords)
                                                                }));
                                                            }}
                                                            style={{
                                                                padding: "8px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "4px",
                                                                fontSize: "14px",
                                                                width: "100%",
                                                                fontFamily: "inherit"
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                {/* Evidence input field */}
                                                <div>
                                                    <label style={{ 
                                                        display: "block", 
                                                        fontSize: "13px", 
                                                        fontWeight: "bold", 
                                                        color: "#333", 
                                                        marginBottom: "4px" 
                                                    }}>
                                                        Evidence (Optional):
                                                        <span
                                                            title="Formatting: **bold**, *italic*, &amp;nbsp; for indent, [link title](URL) for links"
                                                            style={{
                                                                marginLeft: "0.3rem",
                                                                cursor: "help",
                                                                color: "#888",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            ?
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        placeholder="Evidence supporting this seasonal word assignment..."
                                                        value={seasonalWord.evidence || ""}
                                                        onChange={(e) => {
                                                            const newSeasonalWords = [...currentSeasonalWords];
                                                            newSeasonalWords[index] = {
                                                                ...seasonalWord,
                                                                evidence: e.target.value
                                                            };
                                                            setEditData((prev) => ({
                                                                ...prev,
                                                                [key]: JSON.stringify(newSeasonalWords)
                                                            }));
                                                        }}
                                                        style={{
                                                            padding: "8px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                            fontSize: "14px",
                                                            width: "100%",
                                                            fontFamily: "inherit",
                                                            minHeight: "60px",
                                                            resize: "vertical"
                                                        }}
                                                    />
                                                </div>
                                                
                                                <button
                                                    onClick={() => {
                                                        const newSeasonalWords = currentSeasonalWords.filter((_, i) => i !== index);
                                                        setEditData((prev) => ({
                                                            ...prev,
                                                            [key]: JSON.stringify(newSeasonalWords)
                                                        }));
                                                    }}
                                                    style={{
                                                        padding: "6px 12px",
                                                        backgroundColor: "#dc3545",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        alignSelf: "flex-start"
                                                    }}
                                                >
                                                    Remove This Seasonal Word
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <button
                                            onClick={() => {
                                                const newSeasonalWords = [...currentSeasonalWords, { english: "", japanese: "", evidence: "" }];
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    [key]: JSON.stringify(newSeasonalWords)
                                                }));
                                            }}
                                            style={{
                                                padding: "10px 16px",
                                                backgroundColor: "#007cba",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "bold",
                                                alignSelf: "flex-start"
                                            }}
                                        >
                                            ＋ Add New Seasonal Word
                                        </button>
                                        
                                        <datalist id="seasonal-word-english">
                                            {availableSeasonalWords.map((sw) => (
                                                <option key={sw.english} value={sw.english} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear all seasonal words"
                                        style={{ marginTop: "12px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for place fields (placeOfComp and placeOfReceipt)
                    if (key === "placeOfComp" || key === "placeOfReceipt") {
                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                </label>
                                <div className="full-input-wrapper">
                                    <input
                                        type="text"
                                        list={`${key}-places`}
                                        placeholder="Type or select a place name"
                                        value={editData[key] || ""}
                                        onChange={(e) => {
                                            setEditData((prev) => ({
                                                ...prev,
                                                [key]: e.target.value
                                            }));
                                        }}
                                        style={{
                                            padding: "8px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            width: "100%"
                                        }}
                                    />
                                    <datalist id={`${key}-places`}>
                                        {availablePlaces.map((place) => (
                                            <option key={place} value={place} />
                                        ))}
                                    </datalist>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear place"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for replyPoems field
                    if (key === "replyPoems") {
                        // Parse current replyPoems data
                        let currentReplyPoems = [];
                        try {
                            let replyData = editData[key];
                            if (typeof replyData === 'string' && replyData.trim() !== '') {
                                replyData = JSON.parse(replyData);
                            } else if (typeof replyData === 'string' && replyData.trim() === '') {
                                replyData = [];
                            }
                            if (Array.isArray(replyData)) {
                                // Backend format: [["05WM14", true], ["06WM02", true]]
                                // Extract only the poem numbers that are marked as true
                                currentReplyPoems = replyData.filter(([pnum, selected]) => selected).map(([pnum]) => pnum);
                            }
                        } catch (e) {
                            currentReplyPoems = [];
                        }

                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                    <span style={{ 
                                        fontSize: "12px", 
                                        color: "#666", 
                                        fontWeight: "normal", 
                                        marginLeft: "8px" 
                                    }}>
                                        (Poems that reply to this current poem)
                                    </span>
                                </label>
                                <div className="full-input-wrapper">
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", minHeight: "120px", backgroundColor: "#fafafa" }}>
                                        {currentReplyPoems.map((pnum, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                placeholder="Enter poem number (e.g., 05WM14)"
                                                value={pnum}
                                                onChange={(e) => {
                                                    const newReplyPoems = [...currentReplyPoems];
                                                    newReplyPoems[index] = e.target.value;
                                                    // Convert back to backend format
                                                    const backendFormat = newReplyPoems.map(pnum => [pnum, true]);
                                                    setEditData((prev) => ({
                                                        ...prev,
                                                        [key]: JSON.stringify(backendFormat)
                                                    }));
                                                }}
                                                style={{
                                                    padding: "8px 12px",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "4px",
                                                    fontSize: "14px",
                                                    backgroundColor: "#fff",
                                                    width: "80%",
                                                    minWidth: "300px"
                                                }}
                                            />
                                        ))}
                                        
                                        <button
                                            onClick={() => {
                                                const newReplyPoems = [...currentReplyPoems, ""];
                                                const backendFormat = newReplyPoems.map(pnum => [pnum, true]);
                                                setEditData((prev) => ({
                                                    ...prev,
                                                    [key]: JSON.stringify(backendFormat)
                                                }));
                                            }}
                                            style={{
                                                padding: "8px 12px",
                                                backgroundColor: "#007cba",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "bold",
                                                alignSelf: "flex-start"
                                            }}
                                        >
                                            + Add Reply Poem
                                        </button>
                                        
                                        {currentReplyPoems.length === 0 && (
                                            <div style={{ 
                                                color: "#888", 
                                                fontSize: "14px", 
                                                fontStyle: "italic", 
                                                textAlign: "center", 
                                                padding: "20px" 
                                            }}>
                                                No reply poems added yet. Click &quot;Add Reply Poem&quot; to add poems that reply to this current poem.
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear all reply poems"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for messenger field
                    if (key === "messenger") {
                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                </label>
                                <div className="full-input-wrapper">
                                    <input
                                        type="text"
                                        list={`${key}-characters`}
                                        placeholder="Type or select a character name"
                                        value={editData[key] || ""}
                                        onChange={(e) => {
                                            setEditData((prev) => ({
                                                ...prev,
                                                [key]: e.target.value
                                            }));
                                        }}
                                        style={{
                                            padding: "8px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            width: "100%"
                                        }}
                                    />
                                    <datalist id={`${key}-characters`}>
                                        {availableCharacters.map((character) => (
                                            <option key={character} value={character} />
                                        ))}
                                    </datalist>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear messenger"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Special handling for proxy field
                    if (key === "proxy") {
                        return (
                            <div key={key} className="full-field-container">
                                <label className="full-field-label">
                                    {formatFieldName(key)}
                                </label>
                                <div className="full-input-wrapper">
                                    <input
                                        type="text"
                                        list={`${key}-characters`}
                                        placeholder="Type or select a character name"
                                        value={editData[key] || ""}
                                        onChange={(e) => {
                                            setEditData((prev) => ({
                                                ...prev,
                                                [key]: e.target.value
                                            }));
                                        }}
                                        style={{
                                            padding: "8px",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            width: "100%"
                                        }}
                                    />
                                    <datalist id={`${key}-characters`}>
                                        {availableCharacters.map((character) => (
                                            <option key={character} value={character} />
                                        ))}
                                    </datalist>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(key)}
                                        title="Clear proxy"
                                        style={{ marginTop: "8px" }}
                                    >
                                        ❌
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Regular field handling
                    return (
                        <div key={key} className="full-field-container">
                            <label className="full-field-label" style={{ display: "flex", alignItems: "center" }}>
                                {formatFieldName(key)}
                                
                                {(key === "notes" || key === "narrativeContext" || key === "paraphrase" || key === "handwritingDescription") && (
                                    <span
                                        title="Formatting: **bold**, *italic*, &amp;nbsp; for indent, [link title](URL) for links"
                                        style={{
                                            marginLeft: "0.3rem",
                                            cursor: "help",
                                            color: "#888",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        ?
                                    </span>
                                )}
                            </label>
                            <div className="full-input-wrapper">
                                <textarea
                                    className="full-field-textarea"
                                    value={(() => {
                                        const rawValue = editData[key] || "";
                                        // Convert \n to actual line breaks for these specific fields
                                        if (key === "notes" || key === "narrativeContext" || key === "paraphrase" || key === "handwritingDescription") {
                                            return rawValue.replace(/\\n/g, '\n');
                                        }
                                        return rawValue;
                                    })()}
                                    onChange={(e) => {
                                        const newValue = e.target.value;
                                        // Convert actual line breaks back to \n for storage for these specific fields
                                        const valueToStore = (key === "notes" || key === "narrativeContext" || key === "paraphrase" || key === "handwritingDescription") 
                                            ? newValue.replace(/\n/g, '\\n')
                                            : newValue;
                                        
                                        setEditData((prev) => ({
                                            ...prev,
                                            [key]: valueToStore
                                        }));
                                    }}
                                />
                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete(key)}
                                    title="Clear field"
                                >
                                    ❌
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <>
            {showButton && (
                <button
                    onClick={() => setShowPopup(true)}
                    className="edit-poem-button"
                >
                    ✏️ Edit Poem
                </button>
            )}

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-container">
                        <div className="popup-header">
                            <h2 className="popup-title">Edit Poem Data</h2>
                            <p className="popup-subtitle">Chapter {chapter} • Poem {poemNum}</p>
                        </div>
                        
                        {loading && (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                Loading poem data...
                            </div>
                        )}
                        
                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}
                        
                        {!loading && renderFields()}
                        
                        <div className="buttons-container">
                            <button
                                onClick={handleCancel}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="save-button"
                                disabled={loading}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}