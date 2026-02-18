const { getSession } = require('../neo4j_driver/route.prod.js');

import { add } from 'lodash';
import { toNativeTypes } from '../neo4j_driver/utils.prod.js';

async function getData (chapter, number){
	const session = await getSession();

	//all the get method and return the db data
	const queries = {

		res: 'MATCH poem=(g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}) WHERE g.pnum ENDS WITH "' + number + '" \
				OPTIONAL MATCH speaker_rel=(s:Character)-[:SPEAKER_OF]->(g) \
				OPTIONAL MATCH addressee_rel=(g)<-[:ADDRESSEE_OF]-(a:Character) \
				OPTIONAL MATCH trans=(g)-[:TRANSLATION_OF]-(:Translation)-[:TRANSLATOR_OF]-(:People) \
				CALL {WITH g OPTIONAL MATCH (otherChar:Character)-[otherRel:OTHER_RECIPIENT_OF]->(g) \
					RETURN collect(DISTINCT { name: otherChar.name, evidence: CASE WHEN otherRel.evidence IS NULL OR trim(toString(otherRel.evidence)) = "" THEN null ELSE otherRel.evidence END }) AS other_recipients} \
				CALL {WITH g OPTIONAL MATCH (unintendedChar:Character)-[unintendedRel:UNINTENDED_RECIPIENT_OF]->(g) \
					RETURN collect(DISTINCT { name: unintendedChar.name, evidence: CASE WHEN unintendedRel.evidence IS NULL OR trim(toString(unintendedRel.evidence)) = "" THEN null ELSE unintendedRel.evidence END }) AS unintended_recipients} \
				CALL {WITH g OPTIONAL MATCH (groupChar:Character)-[groupRel:GROUP_PARTICIPANT_OF]->(g) \
					RETURN collect(DISTINCT { name: groupChar.name, evidence: CASE WHEN groupRel.evidence IS NULL OR trim(toString(groupRel.evidence)) = "" THEN null ELSE groupRel.evidence END }) AS group_participants} \
				RETURN poem, speaker_rel, addressee_rel, trans, other_recipients, unintended_recipients, group_participants, \
					g.narrative_context as narrative_context, \
					g.paraphrase as paraphrase, \
					g.handwriting_description as handwriting_description, \
					g.paper_or_medium_type as paper_or_medium_type, \
					g.delivery_style as delivery_style, \
					g.Spoken as spoken, g.Written as written, \
					g.evidence_for_spoken_or_written as spoken_or_written_evidence, \
					g.Complete as complete, \
					g.last_updated as last_updated',
		resHonkaInfo:  'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[n:ALLUDES_TO]->(h:Honka)-[r:ANTHOLOGIZED_IN]-(s:Source), (h)<-[:AUTHOR_OF]-(a:People), (h)<-[:TRANSLATION_OF]-(t:Translation)<-[:TRANSLATOR_OF]-(p:People) where g.pnum ends with "' + number + '" return h.Honka as honka, h.Romaji as romaji, s.title as title, a.name as poet, r.order as order, p.name as translator, t.translation as translation, n.notes as notes',
		resRel : 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:INTERNAL_ALLUSION_TO]->(s:Genji_Poem) where g.pnum ends with "' + number + '" return s.pnum as rel, r.evidence as internal_allusion_evidence',
		resPnum : 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}) WHERE g.pnum ENDS WITH (CASE WHEN "' + number + '" < 10 THEN \'0\' + toString("' + number + '") ELSE toString($number) END) RETURN g.pnum as pnum',
		resTag : 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[tag_edge:TAGGED_AS]->(t:Tag) where g.pnum ends with "' + number + '" return t.Type as type, tag_edge.Evidence as evidence',
		resType : 'match (t:Tag) return t.Type as type',
		resSeason : 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)-[r:IN_SEASON_OF]->(s:Season) WHERE g.pnum ends with "' + number + '" RETURN s.name as season, r.evidence as season_evidence',
		resKigo : 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)-[r:HAS_SEASONAL_WORD_OF]->(sw:Seasonal_Word) WHERE g.pnum ends with "' + number + '" RETURN sw.japanese as sw_jp, sw.english as sw_en, r.evidence as sw_evidence',
		resTech: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)-[:EMPLOYS_POETIC_TECHNIQUE]->(pt:Poetic_Technique) WHERE g.pnum ends with "' + number + '" RETURN pt.name as pt_name',
		resPoeticWord: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)-[:HAS_POETIC_WORD_OF]->(pw:Poetic_Word) WHERE g.pnum ends with "' + number + '" RETURN pw.name as pw_name, pw.kanji_hiragana as kanji_hiragana, pw.gloss as gloss, pw.english_equiv as english_equiv',
		resProxy: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)<-[:PROXY_POET_OF]-(a:Character) WHERE g.pnum ends with "' + number + '" RETURN a.name as name',
		resMessenger: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)<-[:MESSENGER_OF]-(a:Character) WHERE g.pnum ends with "' + number + '" RETURN a.name as name',
		resGenjiAge: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)-[:AT_GENJI_AGE_OF]->(age:Genji_Age) WHERE g.pnum ends with "' + number + '" RETURN age.age as genji_age',
		resRepCharacter: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[tag_edge:TAGGED_AS]->(t:Tag {Type: "Character Name Poem"}) where g.pnum ends with "' + number + '" return tag_edge.character_name as repCharacter',
		resPlaceOfComp: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:PLACE_OF_COMPOSITION]->(place:Place) where g.pnum ends with "' + number + '" return place.name as placeOfComp, r.evidence as placeOfComp_evidence',
		resPlaceOfReceipt: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:PLACE_OF_RECEIPT]->(place:Place) where g.pnum ends with "' + number + '" return place.name as placeOfReceipt, r.evidence as placeOfReceipt_evidence',
		resGroup: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:IN_GROUP_OF]->(group:Group) where g.pnum ends with "' + number + '" match (otherPoems:Genji_Poem)-[:IN_GROUP_OF]->(group) where otherPoems.pnum <> g.pnum return otherPoems.pnum as groupMembers',
				resReplyPoem: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:REPLY_TO]->(reply:Genji_Poem) where g.pnum ends with "' + number + '" return reply.pnum as replyPoem',
		resRepliesTo: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (reply:Genji_Poem)-[:REPLY_TO]->(g) where g.pnum ends with "' + number + '" return reply.pnum as replyPoem',
		resFutherReading: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:DISCUSSED_IN]->(s:Source), (s)<-[:AUTHOR_OF]-(a:People) where g.pnum ends with "' + number + '" return s.title as furtherReadings, a.name as author',
		resOtherTranslations: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (ot:Other_Translation)-[:OTHER_TRANSLATION_OF]->(g) where g.pnum ends with "' + number + '" return ot.id as id, ot.name as name, ot.translation as translation'
	};

	const result = {};
	try {
		for (let key in queries) {
			const queryResult = await session.readTransaction(tx => 
				tx.run(queries[key], { chapter, number})
			); 
			result[key] = queryResult;
		} 

		let exchange = []
		result['res'].records.forEach(record => {
			const speakerRel = record.get('speaker_rel');
			const addresseeRel = record.get('addressee_rel');

			const filterValid = (arr) => (arr || []).filter(item => item && item.name);

			const otherRecipientsArr = filterValid(record.get('other_recipients'));
			const unintendedRecipientsArr = filterValid(record.get('unintended_recipients'));
			const groupParticipantsArr = filterValid(record.get('group_participants'));
			
			// Only process if we have at least one relationship
			if (speakerRel || addresseeRel || otherRecipientsArr.length || unintendedRecipientsArr.length || groupParticipantsArr.length) {
				const speakerRelNative = speakerRel ? toNativeTypes(speakerRel) : null;
				const addresseeRelNative = addresseeRel ? toNativeTypes(addresseeRel) : null;			
				const speaker = speakerRelNative ? speakerRelNative.start : (addresseeRelNative ? addresseeRelNative.end : null);
				const addressee = addresseeRelNative ? addresseeRelNative.end : speaker; // Default to speaker for self-addressed
				const poem = speakerRelNative ? speakerRelNative.end : addresseeRelNative ? addresseeRelNative.end : null;

				const asPseudoNode = (x) => ({ properties: { name: x.name } });

				if (speaker && poem) {
					exchange.push({
						start: speaker,
						end: addressee,
						segments: [
							{ start: speaker, end: poem },
							{ start: poem, end: addressee },
							...otherRecipientsArr.map(x => ({
								start: asPseudoNode(x),
								end: poem,
								role: "otherRecipient",
								evidence: x.evidence ?? null
							})), 
							...unintendedRecipientsArr.map(x => ({
								start: asPseudoNode(x),
								end: poem,
								role: "unintendedRecipient",
								evidence: x.evidence ?? null
							})),
							...groupParticipantsArr.map(x => ({
								start: asPseudoNode(x),
								end: poem,
								role: "groupParticipant",
								evidence: x.evidence ?? null
							}))
					
						]
					});
				}
			}
		});
		
		// Merge exchanges with the same (speaker, addressee) pair
const exchangeByKey = new Map();

exchange.forEach(ex => {
    if (!ex.start || !ex.end || !ex.start.properties || !ex.end.properties) return;

    const key = JSON.stringify([ex.start.properties.name, ex.end.properties.name]);

    if (!exchangeByKey.has(key)) {
        // clone object so we don't mutate originals
        exchangeByKey.set(key, {
            ...ex,
            segments: [...ex.segments]
        });
    } else {
        const existing = exchangeByKey.get(key);
        existing.segments.push(...ex.segments);
    }
});

exchange = Array.from(exchangeByKey.values());

		// derive names from segments
		const otherRecipientNames = new Set();
		const unintendedRecipientNames = new Set();
		const groupParticipantNames = new Set();

		exchange.forEach(ex => {
		ex.segments.forEach(seg => {
			const name = seg.start?.properties?.name;
			if (!name) return;

			if (seg.role === 'otherRecipient') otherRecipientNames.add(name);
			if (seg.role === 'unintendedRecipient') unintendedRecipientNames.add(name);
			if (seg.role === 'groupParticipant') groupParticipantNames.add(name);
		});
		});

		let narrative_context = result['res'].records[0]?.get('narrative_context') || null;
		let	paraphrase = result['res'].records[0]?.get('paraphrase') || null;
		let	handwriting_description = result['res'].records[0]?.get('handwriting_description') || null;
		let	paper_or_medium_type = result['res'].records[0]?.get('paper_or_medium_type') || null;
		let delivery_style = result['res'].records[0]?.get('delivery_style') || null;
		let spoken = result['res'].records[0]?.get('spoken') || null;
		let written = result['res'].records[0]?.get('written') || null;
		let spoken_or_written_evidence = result['res'].records[0]?.get('spoken_or_written_evidence') || null;
		let complete = result['res'].records[0]?.get('complete') || null; // poem is complete annotated mark
		let last_updated = result['res'].records[0]?.get('last_updated') || null; // last updated time
		let otherRecipientList = Array.from(otherRecipientNames);
		let unintendedRecipientList = Array.from(unintendedRecipientNames);
		let groupParticipantList = Array.from(groupParticipantNames);

		const filterValid = (arr) => (arr || []).filter(item => item && item.name);
		let otherRecipientData = filterValid(result['res'].records[0]?.get('other_recipients'));
		let unintendedRecipientData = filterValid(result['res'].records[0]?.get('unintended_recipients'));
		let groupParticipantData = filterValid(result['res'].records[0]?.get('group_participants'));


		//for transtemp
		let transTemp = result['res'].records.map(e => {
			const trans = e.get('trans');
			return trans ? toNativeTypes(trans) : null;
		}).filter(e => e !== null).map(e => [e.end.properties.name, e.segments[0].end.properties.translation, e.segments[1].start.properties.WaleyPageNum])
		
		let sources = result['resHonkaInfo'].records.map(e => {
			const honka = e.get('honka');
			const title = e.get('title');
			const romaji = e.get('romaji');
			const poet = e.get('poet');
			const order = e.get('order');
			const translator = e.get('translator');
			const translation = e.get('translation');
			const notes = e.get('notes');
			
			return [
				honka ? Object.values(toNativeTypes(honka)).join('') : '',
				title ? Object.values(toNativeTypes(title)).join('') : '',
				romaji ? Object.values(toNativeTypes(romaji)).join('') : '',
				poet ? Object.values(toNativeTypes(poet)).join('') : '',
				order ? Object.values(toNativeTypes(order)).join('') : '',
				translator ? Object.values(toNativeTypes(translator)).join('') : '',
				translation ? Object.values(toNativeTypes(translation)).join('') : '',
				notes !== null ? (notes ? Object.values(toNativeTypes(notes)).join('') : '') : 'N/A'
			];
		})
		
		//related

		let relatedWithEvidence = []
		result['resRel'].records.forEach(e => {
			const pnum = e.get('rel')
			const evidence = e.get('internal_allusion_evidence')
			if (pnum) {
				const pnumNative = toNativeTypes(pnum);
				relatedWithEvidence.push([Object.values(pnumNative).join(''), evidence])
			}
		})


		//res tag
		let tags = [];
		const seenTypes = new Set();
		result['resTag'].records.forEach(rec => {
			const type = rec.get('type');               
			const evidence = rec.get('evidence') || null;
			if (type && !seenTypes.has(type)) {
				seenTypes.add(type);
				tags.push([type, true, evidence]); // [name, flag, evidence]
			}
		});

		//types
		let types = result['resType'].records.map(e => e.get('type'))

		//ls
		let ls = []
		types.forEach(e => ls.push({value: e, label: e})) 

		//pls
		let temp = result['resPnum'].records.map(e => e.get('pnum'))
		let pls = []
		temp.forEach(e => {
			pls.push({value:e, label:e})
		})

		// season
		let season = result['resSeason'].records[0]?.get('season') || null;
		let season_evidence = result['resSeason'].records[0]?.get('season_evidence') || null;

		// seasonal word
		const kigo = result['resKigo'].records.map(record => ({
			japanese: record.get('sw_jp') || null,
			english: record.get('sw_en') || null,
			evidence: record.get('sw_evidence') || null
		}));

		// poetic technique
		let tech = result['resTech'].records.map(record => record.get('pt_name')).filter(Boolean);
		tech = tech.map(technique => [technique, true]);

		// poetic word
		const poetic_word = result['resPoeticWord'].records.map(record => ({
			name: record.get('pw_name') || null,
			kanji_hiragana: record.get('kanji_hiragana') || null,
			english_equiv: record.get('english_equiv') || null,
			gloss: record.get('gloss') || null
		}));

		// proxy
		let proxy = result['resProxy'].records[0]?.get('name') || null;

		// messenger
		let messenger = result['resMessenger'].records[0]?.get('name') || null;

		// genji age
		let genji_age = result['resGenjiAge'].records[0]?.get('genji_age') || null;

		// character poem
		let repCharacter = result['resRepCharacter'].records[0]?.get('repCharacter') || null;

		// place
		let placeOfComp = result['resPlaceOfComp'].records[0]?.get('placeOfComp') || null;
		let placeOfReceipt = result['resPlaceOfReceipt'].records[0]?.get('placeOfReceipt') || null;
		let placeOfComp_evidence = result['resPlaceOfComp'].records[0]?.get('placeOfComp_evidence') || null;
		let placeOfReceipt_evidence = result['resPlaceOfReceipt'].records[0]?.get('placeOfReceipt_evidence') || null;

		// group poems
		let groupPoems = new Set()
		result['resGroup'].records.map(e => {
			const groupMembers = e.get('groupMembers');
			return groupMembers ? toNativeTypes(groupMembers) : null;
		}).filter(e => e !== null).forEach(e => {groupPoems.add([Object.values(e).join('')])})
		groupPoems = Array.from(groupPoems).flat()
		groupPoems = groupPoems.map(e => [e, true])

		// reply poem (what this poem replies TO - for display)
		let replyPoems = new Set()
		result['resReplyPoem'].records.map(e => {
			const replyPoem = e.get('replyPoem');
			return replyPoem ? toNativeTypes(replyPoem) : null;
		}).filter(e => e !== null).forEach(e => {replyPoems.add([Object.values(e).join('')])})
		replyPoems = Array.from(replyPoems).flat()
		replyPoems = replyPoems.map(e => [e, true])

		// replies to this poem (poems that reply TO this poem - for editing)
		let repliesToThis = new Set()
		result['resRepliesTo'].records.map(e => {
			const replyPoem = e.get('replyPoem');
			return replyPoem ? toNativeTypes(replyPoem) : null;
		}).filter(e => e !== null).forEach(e => {repliesToThis.add([Object.values(e).join('')])})
		repliesToThis = Array.from(repliesToThis).flat()
		repliesToThis = repliesToThis.map(e => [e, true])

		// further reading
		let furtherReadings = []
		result['resFutherReading'].records.forEach(e => {
			const title = e.get('furtherReadings')
			const author = e.get('author')
			if (title && author) {
				const titleNative = toNativeTypes(title);
				const authorNative = toNativeTypes(author);
				furtherReadings.push({
					title: Object.values(titleNative).join(''),
					author: Object.values(authorNative).join('')
				})
			}
		})

		// other translations
		let otherTranslations = []
		result['resOtherTranslations'].records.forEach(e => {
			const id = e.get('id')
			const name = e.get('name')
			const translation = e.get('translation')
			if (id && name && translation) {
				const idNative = toNativeTypes(id);
				const nameNative = toNativeTypes(name);
				const translationNative = toNativeTypes(translation);
				otherTranslations.push({
					id: Object.values(idNative).join(''),
					name: Object.values(nameNative).join(''),
					translation: Object.values(translationNative).join('')
				})
			}
		})

		const data = [
						exchange, 
						transTemp, 
						sources, 
						relatedWithEvidence,
						tags, 
						ls, 
						pls, 
						narrative_context, 
						paraphrase, 
						handwriting_description, 
						paper_or_medium_type, 
						delivery_style,
						season,
						kigo,
						tech,
						poetic_word,
						proxy,
						messenger,
						genji_age,
						repCharacter,
						placeOfComp,
						placeOfReceipt,
						spoken,
						written,
						season_evidence,
						placeOfComp_evidence,
						placeOfReceipt_evidence,
						groupPoems,
						replyPoems,
						furtherReadings,
						spoken_or_written_evidence,
						repliesToThis,
						complete,
						last_updated,
						otherTranslations,
						otherRecipientList, // This is names only
						unintendedRecipientList,
						groupParticipantList,
						otherRecipientData, // This has evidence
						unintendedRecipientData,
						groupParticipantData,
					];

		return (data);

	} catch(error) {
		console.error('Failed to execute queries:', error);
		console.error('Error details:', {
			chapter,
			number,
			stack: error.stack
		});
		throw new Error(`Failed to execute queries for chapter ${chapter}, number ${number}: ${error.message}`);
	} finally{
		await session.close();
	}
}

export const GET = async (request) => {
	try {   
		const {searchParams} = new URL(request.url);
		const chapter = searchParams.get('chapter')
		const number = searchParams.get('number')
		const data = await getData(chapter, number)
		return new Response(JSON.stringify(data), {status: 200})
	}catch (error){
		return new Response(error, {status: 500})
	}
} 