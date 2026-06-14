const { getSession } = require('../../neo4j_driver/route.prod.js');
//const { toNativeTypes } = require('../../neo4j_driver/utils.prod.js');
//var kuromoji = require("kuromoji");

// let tokenizer = null;
// const initializeTokenizer = () => {
//   return new Promise((resolve, reject) => {
//     if (tokenizer) {
//       resolve(tokenizer);
//     } else {
//       kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, _tokenizer) => {
//         if(err) {
//           reject(err);
//         } else {
//           tokenizer = _tokenizer;
//           resolve(tokenizer);
//         }
//       });
//     }
//   });
// };


// async function tokenizeJapanese(text) {
//     try {
//       const _tokenizer = await initializeTokenizer();
//       const tokens = _tokenizer.tokenize(text);
//       return tokens.map(token => token.surface_form);
//     } catch (error) {
//       console.error('Tokenization error:', error);
//       return [text]; // if failed tokenizing, return original text
//     }
//   }

// api for keyword poem search
async function generalSearch(q, gender, translatorNames = [], includeRomanization = false) {
    try {
        const session = await getSession();
        //const searchTerms = await tokenizeJapanese(q);
        //console.log('Tokenized search terms:', searchTerms);
        //const searchTerms = [q];
        
        // Neo4j cypher query to filter poems' Japanese, Romaji(, Translation) with search keyword q
        const query = `
            MATCH (p:Genji_Poem)
            ${
            q.toLowerCase() !== '=#='
                ? `
            WHERE
            (
                size($translatorNames) > 0 AND (
                    EXISTS {
                        (p)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(tr:People)
                        WHERE tr.name IN $translatorNames
                        AND toLower(t.translation) CONTAINS toLower($q)
                    }
                    OR toLower(p.Japanese) CONTAINS toLower($q)
                    OR (
                        $includeRomanization = true
                        AND toLower(p.Romaji) CONTAINS toLower($q)
                    )
                )
            )
            OR
            (
                // If none selected -> search all translations,
                // plus Japanese, and optionally Romaji if includeRomanization is true
                size($translatorNames) = 0 AND (
                    EXISTS {
                        (p)<-[:TRANSLATION_OF]-(t:Translation)
                        WHERE toLower(t.translation) CONTAINS toLower($q)
                    }
                    OR toLower(p.Japanese) CONTAINS toLower($q)
                    OR (
                        $includeRomanization = true
                        AND toLower(p.Romaji) CONTAINS toLower($q)
                    )
                )
            )
                `
                : ''
            }
            WITH DISTINCT p
            OPTIONAL MATCH (p)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(translator:People)
            OPTIONAL MATCH (p)<-[:ADDRESSEE_OF]-(addressee:Character)
            OPTIONAL MATCH (p)<-[:SPEAKER_OF]-(speaker:Character)
            OPTIONAL MATCH (p)-[:IN_SEASON_OF]->(season:Season)
            OPTIONAL MATCH (p)-[:USES_POETIC_TECHNIQUE_OF]->(pt:Poetic_Technique)
            OPTIONAL MATCH (p)-[:AT_GENJI_AGE_OF]->(ga:Genji_Age)
            OPTIONAL MATCH (p)-[:HAS_PERSON_REFERENCE]->(pr:Person_Reference)
            OPTIONAL MATCH (p)-[:TAGGED_AS]->(tag:Tag)
                WHERE tag.Type IN ["Proffered Poem", "Reply Poem", "Group Poem", "Soliloquy"]
            WITH p, 
                collect(DISTINCT {translator_name: COALESCE(translator.name, ""), text: t.translation}) AS translations,
                collect(DISTINCT addressee.name) AS addressee_names,
                collect(DISTINCT addressee.gender) AS addressee_genders,
                speaker,
                season,
                pt,
                ga,
                collect(DISTINCT tag.Type) AS poem_types,
                collect(DISTINCT pr.value) AS person_reference_values
            WHERE ($genders IS NULL OR toLower(speaker.gender) IN $genders)
            RETURN DISTINCT
                COALESCE(p.pnum, "") AS pnum,
                COALESCE(p.Japanese, "") AS Japanese,
                COALESCE(p.Romaji, "") AS Romaji,
                COALESCE(p.paraphrase, "") AS paraphrase,
                COALESCE(p.last_updated, "") AS last_updated,
                COALESCE(apoc.text.join(addressee_names, " & "), "") AS addressee_name,
                COALESCE(apoc.text.join(addressee_genders, " & "), "") AS addressee_gender,
                COALESCE(speaker.name, "") AS speaker_name,
                COALESCE(speaker.gender, "") AS speaker_gender,
                COALESCE(speaker.color, "") AS speaker_color,
                COALESCE(season.name, "") AS season,
                COALESCE(pt.name, "") AS poetic_tech,
                COALESCE(ga.age, "") AS genji_age,
                COALESCE(p.Complete, "") AS annotations_complete,
                CASE
                    WHEN size(poem_types) > 0 THEN poem_types[0]
                    ELSE ""
                END AS poem_type,
                CASE
                    WHEN size(person_reference_values) > 0 THEN person_reference_values[0]
                    ELSE ""
                END AS person_reference,
                EXISTS {
                    (p)<-[:TRANSLATION_OF]-(tp:Translation)-[:TAGGED_AS]->(:Tag {Type: "Contain_a_Pronoun", Value: "true"})
                } AS contain_a_pronoun,
                EXISTS {
                    (p)<-[:TRANSLATION_OF]-(tn:Translation)-[:TAGGED_AS]->(:Tag {Type: "Contain_a_Person_Noun", Value: "true"})
                } AS contain_a_person_referent,
                COALESCE([x IN translations WHERE x.translator_name = "Waley"][0].text, "") AS Waley_translation,
                COALESCE([x IN translations WHERE x.translator_name = "Seidensticker"][0].text, "") AS Seidensticker_translation,
                COALESCE([x IN translations WHERE x.translator_name = "Tyler"][0].text, "") AS Tyler_translation,
                COALESCE([x IN translations WHERE x.translator_name = "Washburn"][0].text, "") AS Washburn_translation,
                COALESCE([x IN translations WHERE x.translator_name = "Cranston"][0].text, "") AS Cranston_translation,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Omitted By Waley"}) } AS omitted_by_waley,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Omitted by Seidensticker"}) } AS omitted_by_seidensticker,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Bad Poems"}) } AS bad_poems,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Group Poem"}) } AS group_poem_tag,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Character Name Poem"}) } AS character_name_poem,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Chapter Title Poem"}) } AS chapter_title_poem,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Morning After Poem"}) } AS morning_after_poem,
                EXISTS { (p)-[:TAGGED_AS]->(:Tag {Type: "Proxy Poem"}) } AS proxy_poem,
                EXISTS { (p)-[:IN_RUN]->(:Run) } AS in_run
            ORDER BY pnum
        `;

        let res;
        try {
            const genders = gender
            ? gender.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
            : null;

            res = await session.readTransaction(tx =>
            tx.run(query, {
                q,
                translatorNames,
                genders,
                includeRomanization,
            })
            );
        } catch (queryError) {
            console.error('Cypher query execution failed:', queryError);
            throw queryError;
        }

        await session.close();

        // Format and sort related poems
        if (res.records.length > 0) {
            const searchResults = res.records.map(record => {
                const pnum = (record.get('pnum') || "").toString();
                return {
                    chapterNum: pnum.substring(0, 2),
                    chapterAbr: pnum.substring(2, 4),
                    poemNum:    pnum.substring(4),
                    japanese:   record.get('Japanese') || "",
                    romaji:     record.get('Romaji') || "",
                    paraphrase: record.get('paraphrase') || "",
                    last_updated: (record.get('last_updated') || "").toString(),
                    genji_age:  (record.get('genji_age') ?? "").toString(),
                    annotations_complete: record.get('annotations_complete') || "",
                    addressee_name:   record.get('addressee_name') || "",
                    addressee_gender: record.get('addressee_gender') || "",
                    speaker_name:     record.get('speaker_name') || "",
                    speaker_gender:   record.get('speaker_gender') || "",
                    speaker_color:    record.get('speaker_color') || "",
                    season:           record.get('season') || "",
                    peotic_tech:      record.get('poetic_tech') || "",
                    poem_type:        (record.get('poem_type') || "").toString(),
                    person_reference: (record.get('person_reference') || "").toString(),
                    contain_a_pronoun: !!record.get('contain_a_pronoun'),
                    contain_a_person_referent: !!record.get('contain_a_person_referent'),
                    waley_translation:         record.get('Waley_translation') || "",
                    seidensticker_translation: record.get('Seidensticker_translation') || "",
                    tyler_translation:         record.get('Tyler_translation') || "",
                    washburn_translation:      record.get('Washburn_translation') || "",
                    cranston_translation:      record.get('Cranston_translation') || "",
                    omitted_by_waley: !!record.get('omitted_by_waley'),
                    omitted_by_seidensticker: !!record.get('omitted_by_seidensticker'),
                    bad_poems: !!record.get('bad_poems'),
                    group_poem_tag: !!record.get('group_poem_tag'),
                    character_name_poem: !!record.get('character_name_poem'),
                    chapter_title_poem: !!record.get('chapter_title_poem'),
                    morning_after_poem: !!record.get('morning_after_poem'),
                    proxy_poem: !!record.get('proxy_poem'),
                    in_run: !!record.get('in_run'),
                };
            });

            return { searchResults };
        } else {
            console.log(`No poem found with name: ${q}`);
            return { searchResults: [] };
        }
    }
    catch (error) {
        console.error('Error in generalSearch:', error);
        return null;
    }
}

// Export data from API endpoint
export const GET = async (request) => {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '=#=');
    const gender = searchParams.get('gender'); // Get gender filter
    const translatorsRaw = searchParams.get('translators');
    const includeRomanization = searchParams.get('includeRomanization') === 'true';
    const KEY_TO_TRANSLATOR_NAME = {
      waley: "Waley",
      washburn: "Washburn",
      seidensticker: "Seidensticker",
      tyler: "Tyler",
      cranston: "Cranston",
    };

    const translatorNames = (translatorsRaw ?? "")
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
      .map(k => KEY_TO_TRANSLATOR_NAME[k])
      .filter(Boolean);

    // if (!q) {
    //     return new Response(JSON.stringify({ message: 'Search keyword is required' }), { status: 400 });
    // }

    try {
    //     const data = await generalSearch(q, gender); // Pass gender to search
    //     if (data) {
    //         return new Response(JSON.stringify(data), { status: 200 });
    //     } else {
    //         return new Response(JSON.stringify({ message: 'Search keyword Not found' }), { status: 404 });
    //     }
        const data = await generalSearch(q, gender, translatorNames, includeRomanization);
        return new Response(JSON.stringify(data || { searchResults: [] }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Error in API", message: error.toString() }), { status: 500 });
    }
};