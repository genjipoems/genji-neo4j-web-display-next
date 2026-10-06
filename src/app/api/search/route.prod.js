const { getSession } = require('../neo4j_driver/route.prod.js');

import { toNativeTypes, getPoemTableContent } from '../neo4j_driver/utils.prod.js';

async function getCharQuery (query){
    const session = await getSession();
	try {

        const results = await session.readTransaction(tx => tx.run(query));

        const characters = results.records.map(row => {
            const charObject = toNativeTypes(row.get('char'));
            return Object.values(charObject).join('');
        });

        const genders = results.records.map(row => {
            const genderObject = toNativeTypes(row.get('gender'));
            return Object.values(genderObject).join('');
        });

        return [characters, genders];
	} catch(error) {
		console.error('Failed to execute queries in search in getCharQuery(query):', error);
		result.status(500).json({ error: 'Failed to execute queries' });
	} finally{
		await session.close();
	}
}

async function getInteractionsQuery (query){
    const session = await getSession();
    const { get, details } = query; 
    const { speaker, addressee, chapter } = details;

    try {
        const res2 = await session.readTransaction(tx => tx.run(get, { speaker, addressee, chapter }));
        let poemRes = res2.records.map(row => { return toNativeTypes(row.get('exchange')) })
        let transTemp = res2.records.map(row => {
            const transProps = toNativeTypes(row.get('trans')).end.properties;
            const translatorName = row.get('translatorName');
            return [
                [...Object.keys(transProps), 'translatorName'],
                [...Object.values(transProps), translatorName]
            ];
        })

        let [plist, info, propname] = getPoemTableContent(poemRes, transTemp);
        return { plist: plist, info: info, propname: propname }
    } catch(error) {

    } finally {
        await session.close();
    }
}

function generateInteractionsQuery (spkrGen, addrGen, speaker, addressee, chapter) {
    let getSpeaker, getAddressee, getChapter;
    if (speaker === 'Any' && spkrGen === 'Any') {
        getSpeaker = '(:Character)'
    } else if (speaker === 'Any' && spkrGen !== 'Any') {
        getSpeaker = '(:Character {gender: "' + spkrGen + '"})'
    } else {
        getSpeaker = '(:Character {name: "' + speaker + '"})'
    }
    if (addressee === 'Any' && addrGen === 'Any') {
        getAddressee = '(:Character)'
    } else if (addressee === 'Any' && addrGen !== 'Any') {
        getAddressee = '(:Character {gender: "' + addrGen + '"})'
    } else {
        getAddressee = '(:Character {name: "' + addressee + '"})'
    }
    if (chapter === 'anychp') {
        getChapter = ', (g)-[:INCLUDED_IN]-(:Chapter), '
    } else {
        // as of Apirl 2022, the chapter numbers are in string
        getChapter = ', (g)-[:INCLUDED_IN]-(:Chapter {chapter_number: "' + chapter + '"}), '
    }
let get = 'match exchange=' + getSpeaker + '-[:SPEAKER_OF]-(g:Genji_Poem)-'
    + '[:ADDRESSEE_OF]-' + getAddressee
    + getChapter
    + 'trans=(g)-[:TRANSLATION_OF]-(t:Translation)-[:TRANSLATOR_OF]-(tr:Translator) '
    + ' return exchange, trans, tr.name as translatorName';
    return { get: get, details: { speaker, addressee, chapter } };
}

async function getData ( searchParams ) {
    let data;
    switch (searchParams.get('requestType')) {
        case 'get characters':
            data = getCharQuery(searchParams.get('getChar'));
            break;
        case 'get interactions':
            data = getInteractionsQuery(generateInteractionsQuery(
                searchParams.get('spkrGen'), 
                searchParams.get('addrGen'),
                searchParams.get('speaker'), 
                searchParams.get('addressee'), 
                searchParams.get('chapter')))
            break;
        default:
            console.error('Invalid request type:', searchParams.requestType);
    }
    return data;
}

export const GET = async (request) =>{
	try {   
		const {searchParams} = new URL(request.url);
		const data = await getData( searchParams )

		return new Response(JSON.stringify(data), {status: 200})
	}catch (error){
		return new Response(error, {status: 500})
	}
} 

/*
    Debugging Tools:
    - backend API URL for getChar: http://localhost:3000/api/search?requestType=get%20characters&&getChar=match%20(c:Character)%20return%20c.name%20as%20char,%20c.gender%20as%20gender%20order%20by%20c.name
    - backend API URL for getInteractions: http://localhost:3000/api/search?requestType=get interactions&&spkrGen=Any&&addrGen=Any&&get=match exchange=(:Character {gender: "male,female"})-[:SPEAKER_OF]-(g:Genji_Poem)-[:ADDRESSEE_OF]-(:Character {gender: "male,female,multiple,nonhuman"}), (g)-[:INCLUDED_IN]-(:Chapter), trans=(g)-[:TRANSLATION_OF]-(t:Translation)  return exchange, trans&&speaker=Any&&addressee=Any&&chapter=anychp
*/