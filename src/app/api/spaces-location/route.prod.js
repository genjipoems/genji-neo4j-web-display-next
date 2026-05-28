const { getSession } = require('../neo4j_driver/route.prod.js');

import { add } from 'lodash';
import { toNativeTypes } from '../neo4j_driver/utils.prod.js';

async function getData (chapter, number){
	const session = await getSession();

	//all the get method and return the db data

	const queries = {
		resPlaces : 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g)-[:PLACE_OF_COMPOSITION|PLACE_OF_RECEIPT]->(place:Place) RETURN DISTINCT place.name as place, place.lat as lat, place.lng as lng',
		resPnum : 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}) WHERE g.pnum ENDS WITH (CASE WHEN "' + number + '" < 10 THEN \'0\' + toString("' + number + '") ELSE toString($number) END) RETURN g.pnum as pnum',
		resMessenger: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(c:Chapter {chapter_number: "' + chapter + '"}), (g:Genji_Poem)<-[:MESSENGER_OF]-(a:Character) WHERE g.pnum ends with "' + number + '" RETURN a.name as name',
		resPlaceOfComp: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:PLACE_OF_COMPOSITION]->(place:Place) WHERE g.pnum ENDS WITH "' + number + '" RETURN place.name as placeOfComp, r.evidence as placeOfComp_evidence, place.lat as lat, place.lng as lng',
		resPlaceOfReceipt: 'MATCH (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[r:PLACE_OF_RECEIPT]->(place:Place) WHERE g.pnum ENDS WITH "' + number + '" RETURN place.name as placeOfReceipt, r.evidence as placeOfReceipt_evidence, place.lat as lat, place.lng as lng',		
		resGroup: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:IN_GROUP_OF]->(group:Group) where g.pnum ends with "' + number + '" match (otherPoems:Genji_Poem)-[:IN_GROUP_OF]->(group) where otherPoems.pnum <> g.pnum return otherPoems.pnum as groupMembers',
		resReplyPoem: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (g)-[:REPLY_TO]->(reply:Genji_Poem) where g.pnum ends with "' + number + '" return reply.pnum as replyPoem',
		resRepliesTo: 'match (g:Genji_Poem)-[:INCLUDED_IN]->(:Chapter {chapter_number: "' + chapter + '"}), (reply:Genji_Poem)-[:REPLY_TO]->(g) where g.pnum ends with "' + number + '" return reply.pnum as replyPoem',
	};

	const result = {};
	try {
		for (let key in queries) {
			const queryResult = await session.readTransaction(tx => 
				tx.run(queries[key], { chapter, number})
			); 
			result[key] = queryResult;
		} 


		// messenger
		let messenger = result['resMessenger'].records[0]?.get('name') || null;
		
		// places
		let place = result['resPlaces'].records.map(record => ({
			name: record.get('place'),
			lat: record.get('lat') ? toNativeTypes(record.get('lat')) : null,
			lng: record.get('lng') ? toNativeTypes(record.get('lng')) : null
		}));
		let pnum = result['resPnum'].records[0]?.get('pnum') || null;
		let compRecord = result['resPlaceOfComp'].records[0];
		let placeOfComp = compRecord?.get('placeOfComp') || null;
		let compLat = compRecord?.get('lat') ? toNativeTypes(compRecord.get('lat')) : null;
		let compLng = compRecord?.get('lng') ? toNativeTypes(compRecord.get('lng')) : null;

		let receiptRecord = result['resPlaceOfReceipt'].records[0];
		let placeOfReceipt = receiptRecord?.get('placeOfReceipt') || null;
		let receiptLat = receiptRecord?.get('lat') ? toNativeTypes(receiptRecord.get('lat')) : null;
		let receiptLng = receiptRecord?.get('lng') ? toNativeTypes(receiptRecord.get('lng')) : null;
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


		const data = {
			places: place,

			composition: {
				pnum: pnum,
				name: placeOfComp,
				evidence: placeOfComp_evidence,
				lat: compLat,
				lng: compLng
			},
			
			receipt: {
				pnum: pnum,
				name: placeOfReceipt,
				evidence: placeOfReceipt_evidence,
				lat: receiptLat,
				lng: receiptLng
			},
			
			relationships: {
				groupPoems,
				replyPoems,
				repliesToThis,
				messenger
			}
		};

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