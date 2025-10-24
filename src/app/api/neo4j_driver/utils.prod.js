import { isInt, isDate, isDateTime, isTime, isLocalDateTime, isLocalTime, isDuration } from 'neo4j-driver'
const traj = require('./traj.prod')

// tag::toNativeTypes[]
/**
 * Convert Neo4j Properties back into JavaScript types
 *
 * @param {Record<string, any>} properties
 * @return {Record<string, any>}
 */
export function toNativeTypes(properties) {
    // Handle null or undefined input
    if (!properties || typeof properties !== 'object') {
        return properties;
    }
    
    return Object.fromEntries(Object.keys(properties).map((key) => {
        let value = valueToNativeType(properties[key])

        return [ key , value ]
    }))
}

/**
 * Convert an individual value to its JavaScript equivalent
 *
 * @param {any} value
 * @returns {any}
 */
function valueToNativeType(value) {
    if ( Array.isArray(value) ) {
        value = value.map(innerValue => valueToNativeType(innerValue))
    }
    else if ( isInt(value) ) {
        value = value.toNumber()
    }
    else if (
        isDate(value) ||
        isDateTime(value) ||
        isTime(value) ||
        isLocalDateTime(value) ||
        isLocalTime(value) ||
        isDuration(value)
    ) {
        value = value.toString()
    }
    else if (typeof value === 'object' && value !== undefined  && value !== null) {
        value = toNativeTypes(value)
    }

    return value
}
// end::toNativeTypes[]

export function getChpList() {
    return ["Kiritsubo 桐壺","Hahakigi 帚木","Utsusemi 空蝉","Yūgao 夕顔","Wakamurasaki 若紫","Suetsumuhana 末摘花","Momiji no Ga 紅葉賀","Hana no En 花宴","Aoi 葵","Sakaki 榊","Hana Chiru Sato 花散里","Suma 須磨","Akashi 明石","Miotsukushi 澪標","Yomogiu 蓬生","Sekiya 関屋","E Awase 絵合","Matsukaze 松風","Usugumo 薄雲","Asagao 朝顔","Otome 乙女","Tamakazura 玉鬘","Hatsune 初音","Kochō 胡蝶","Hotaru 螢","Tokonatsu 常夏","Kagaribi 篝火","Nowaki 野分","Miyuki 行幸","Fujibakama 藤袴","Makibashira 真木柱","Umegae 梅枝","Fuji no Uraba 藤裏葉","Wakana: Jō 若菜上","Wakana: Ge 若菜下","Kashiwagi 柏木","Yokobue 横笛","Suzumushi 鈴虫","Yūgiri 夕霧","Minori 御法","Maboroshi 幻","Niou Miya 匂宮","Kōbai 紅梅","Takekawa 竹河","Hashihime 橋姫","Shii ga Moto 椎本","Agemaki 総角","Sawarabi 早蕨","Yadorigi 宿木","Azumaya 東屋","Ukifune 浮舟","Kagerō 蜻蛉","Tenarai 手習","Yume no Ukihashi 夢浮橋"]
}

// input: String pnum, poem number
// output: A html paragraph that contains the chapter name of a Genji poem with Romaji in front of Kanji
export function parseChp(pnum) {
    const chapterNames = {'01':'Kiritsubo 桐壺','02':'Hahakigi 帚木','03':'Utsusemi 空蝉','04':'Yūgao 夕顔','05':'Wakamurasaki 若紫','06':'Suetsumuhana 末摘花','07':'Momiji no Ga 紅葉賀','08':'Hana no En 花宴','09':'Aoi 葵','10':'Sakaki 榊','11':'Hana Chiru Sato 花散里','12':'Suma 須磨','13':'Akashi 明石','14':'Miotsukushi 澪標','15':'Yomogiu 蓬生','16':'Sekiya 関屋','17':'E Awase 絵合','18':'Matsukaze 松風','19':'Usugumo 薄雲','20':'Asagao 朝顔','21':'Otome 乙女','22':'Tamakazura 玉鬘','23':'Hatsune 初音','24':'Kochō 胡蝶','25':'Hotaru 螢','26':'Tokonatsu 常夏','27':'Kagaribi 篝火','28':'Nowaki 野分','29':'Miyuki 行幸','30':'Fujibakama 藤袴','31':'Makibashira 真木柱','32':'Umegae 梅枝','33':'Fuji no Uraba 藤裏葉','34':'Wakana: Jō 若菜上','35':'Wakana: Ge 若菜下','36':'Kashiwagi 柏木','37':'Yokobue 横笛','38':'Suzumushi 鈴虫','39':'Yūgiri 夕霧','40':'Minori 御法','41':'Maboroshi 幻','42':'Niou Miya 匂宮','43':'Kōbai 紅梅','44':'Takekawa 竹河','45':'Hashihime 橋姫','46':'Shii ga Moto 椎本','47':'Agemaki 総角','48':'Sawarabi 早蕨','49':'Yadorigi 宿木','50':'Azumaya 東屋','51':'Ukifune 浮舟','52':'Kagerō 蜻蛉','53':'Tenarai 手習','54':'Yume no Ukihashi 夢浮橋'};

    let [chp, _, smt] = pnum.match(/.{1,2}/g);
    let chp_name = chapterNames[chp];
    if (!chp_name) {
        chp_name = 'Unknown Chapter';
    }

    return (
        <p>{chp} {chp_name}</p>
    );
}

// input: String pnum, poem number
// output: A html paragraph that contains the order of a poem in its chapter
export function parseOrder(pnum) {
    let [chp, _, order] = pnum.match(/.{1,2}/g)
    order = parseInt(order)
    return (
        <p>{order}</p>
    )
}

// plist: a list of string
export function sortPnums(plist) {
    for (let i = 0; i < plist.length-1; i++) {
        for (let j = 0; j < plist.length-i-1; j++) {
            if ((parseInt(plist[j][0].substring(0, 2)) > parseInt(plist[j+1][0].substring(0, 2))) 
            || (parseInt(plist[j][0].substring(0, 2)) >= parseInt(plist[j+1][0].substring(0, 2)) 
            && parseInt(plist[j][0].substring(4, 6)) > parseInt(plist[j+1][0].substring(4, 6)))) {
                let temp = plist[j+1]
                plist[j+1] = plist[j]
                plist[j] = temp
            }
        }
    }
    return plist
}

// objList: a list of object in the form of {value: val, label: lab}, where the values are strings of pnums.
export function sortPnumsFromObjList(objList) {
    for (let i = 0; i < objList.length-1; i++) {
        for (let j = 0; j < objList.length-i-1; j++) {
            if ((parseInt(objList[j].value.substring(0, 2)) > parseInt(objList[j+1].value.substring(0, 2))) 
            || (parseInt(objList[j].value.substring(0, 2)) >= parseInt(objList[j+1].value.substring(0, 2)) 
            && parseInt(objList[j].value.substring(4, 6)) > parseInt(objList[j+1].value.substring(4, 6)))) {
                let temp = objList[j+1]
                objList[j+1] = objList[j]
                objList[j] = temp
            }
        }
    }
    return objList
}

export function getPoemTableContent(poemRes, transTemp) {
    let speakers = poemRes.map(row => row.segments[0].start.properties.name)
    let addressees = poemRes.map(row => row.segments[1].end.properties.name)
    let Japanese = poemRes.map(row => row.segments[1].start.properties)
    let info = {}
    let plist = new Set()
    for (let i = 0; i < Japanese.length; i++) {
        plist.add(JSON.stringify([Japanese[i].pnum, speakers[i], addressees[i]]))
    }
    plist = Array.from(plist).map(item => JSON.parse(item))
    plist = sortPnums(plist)
    // make Japanese non-repetitive
    let jsonObject = Japanese.map(JSON.stringify);
    let uniqueSet = new Set(jsonObject);
    Japanese = Array.from(uniqueSet).map(JSON.parse);
    // prepares translations, notes, Waley#, etc., in info
    transTemp.forEach(element => {
        // element: [keys, properties]
        if (element[0].length !== 0 && element[0].includes('id')) {
            let auth, pnum
            pnum = element[1][element[0].indexOf('id')].substring(0, 6)
            auth = element[1][element[0].indexOf('id')].substring(6, 7)
            if (info[pnum] === undefined) {
                info[pnum] = {}
            }
            if (auth === 'A') {
                auth = 'Waley'
            } else if (auth === 'C') {
                auth = 'Cranston'
            } else if (auth === 'S') {
                auth = 'Seidensticker'
            } else if (auth === 'T') {
                auth = 'Tyler'
            } else {
                auth = 'Washburn'
            }
            if (element[0].includes('translation')) {
                info[pnum][auth] = element[1][element[0].indexOf('translation')]
            } else {
                info[pnum][auth] = 'N/A'
            }
            if (element[0].includes('WaleyPageNum')) {
                info[pnum]['WaleyPageNum'] = element[1][element[0].indexOf('WaleyPageNum')]
            } else if (auth === 'Waley' && typeof(info[pnum]['WaleyPageNum']) !== 'number') {
                info[pnum]['WaleyPageNum'] = 'N/A'
            }
        }
    });
    Japanese.forEach(e => {
        let n = e.pnum
        if (info[n] === undefined) {
            info[n] = {}
            info[n]['WaleyPageNum'] = 'N/A'
        }
        info[n].Japanese = e.Japanese
        info[n].Romaji = e.Romaji
    })
    // preparing a matrix of edit propertyNames
    let propname = Array.from(Array(plist.length), () => new Array(4))
    propname.forEach(row => {
        row[0] = 'Japanese'
        row[1] = 'Romaji'
        row[2] = 'empty'
        row[3] = 'empty'
    })
    return [plist, info, propname]
}

export function concatObj(e) {
    return Object.values(e).join('')
}



//************  Family tree constructor  ***************/
 
//*******//   //*******//   //*******//   //*******//   //*******//

export function generateGeneology(resGraph, resGraph2, resGraph3) { //resGraph = characters && resGraph2 = relationships && resGraph3 = character_name, japanese_name, color, gender    
    //make dictionaries
    var jp_dict = {}
    var color_dict = {}
	var gender_dict = {}

	for (const [ch_name, jp_name, c, g] of resGraph3) {
		jp_dict[ch_name] = jp_name;
		color_dict[ch_name] = c;
		gender_dict[ch_name] = g; 
	}
    
    
    // lookup: Character -> [["type_rel", "who is concerned"], ...]
    var edges_count = {}
    for (const chrctr of resGraph) {
        edges_count[chrctr] = []
    }

    for (let i = 0; i < resGraph2.length; i++) {
        var character = resGraph2[i][0]
        edges_count[character].push([resGraph2[i][1] ,resGraph2[i][2]])
    }
    
    // Start with most popular character
    var popularity = Object.entries(edges_count).map(([key, value]) => ([ key, value ]))

    popularity.sort(function(a,b) {
        return b[1].length - a[1].length 
    })

    //*** START MAKING GENEOLOGICAL TREE ***// 

    var characters_X_Y = [] //***RETURN: This array's every single element: [character_name, X, Y, people_related] 

    var love_nodes_X_Y = [] //***RETURN: This array depicts: (Marriage, love, troubled love): [person1, person2, rel_type, X, Y] 

    var X_Y_coords = {} //Which x_y coords are occupied? 
    X_Y_coords[[-100, -100]] = true // X and Y for people without any ties

    var pop_copy = [...popularity] 

    // Until every character in array "popularity" has been gone through... 
    while (popularity.length > 0) {

        var [character, rels] = popularity[0] // First person in the "queue" 

        // This character's X and Y 
        var X_main = 0
        var Y_main = 0
        var already_assigned = false  

        // See if already assigned previously
        for (const [character_name, x_c, y_c, ] of characters_X_Y) {  
            if (character_name == character) {
                already_assigned = true 
                X_main = x_c
                Y_main = y_c 
                break
            } 
        }

        if (!already_assigned) { // If it is not yet assigned previously, see if it's related to other peoeple! 

            //1. mentioned by people who were previously added in the array
            for (const [character_name, x_p, y_p, relationships] of characters_X_Y) { 
                for (const [, chrctr] of relationships) {
                    if (!(X_main == 0 && Y_main == 0)) {  //(We just determined it!) 
                        break
                    }
                    if (chrctr == character) {
                        // find appropriate coords
                        X_main = x_p - 250
                        Y_main = y_p + 500
                        while (X_Y_coords[[X_main, Y_main]]) {
                            X_main -= 500
                        }
                    }
                }
            }

            //2. Mentioned by the character's ties (we still haven't determined it)
            if (X_main == 0 && Y_main == 0) { 
                for (const [rel_type, person] of rels) { 
                    for (const [chrctr, x_p, y_p, ] of characters_X_Y) { 
                        if (chrctr == person) {
                            // find appropriate coords 
                            X_main = x_p - 250
                            Y_main = y_p
            
                            if (rel_type == "FATHER_OF" || rel_type == "MOTHER_OF") {
                                Y_main -= 500
                            } else if (rel_type == "ADOPTIVE_CHILD_OF" || rel_type == "DAUGHTER_OF" || rel_type == "SON_OF" || rel_type == "SERVANT_OF" || rel_type == "PET_OF") {
                                X_main += 250  
                                Y_main += 1000 
                            } else {
                                Y_main += 500 
                            }

                            while (X_Y_coords[[X_main, Y_main]]) {
                                X_main -= 500
                            }
                        }
                    }
                } 
            }

            //still no relationships
            if (rels.length == 0) {
                var every_single_character_remaining_has_no_rel = true
                for (const [ , , , rels] of popularity) {
                    if (rels == []) {
                        every_single_character_remaining_has_no_rel = false
                        break 
                    }
                }
                if (every_single_character_remaining_has_no_rel) {
                    characters_X_Y.push([character, 0, -5000, rels])
                    popularity.splice(0,1)
                    continue
                }
            }
    
            //***If still no matches  -> DELAY IT for later!
            if (X_main == 0 && Y_main == 0) {
                if (characters_X_Y.length != 0) {
                    popularity.splice(0,1)
                    popularity.push([character, rels]) //Add it to back of the queue!
                    continue
                }
            }

            // We got our X Ys for this character! 
            X_Y_coords[[X_main, Y_main]] = true
            characters_X_Y.push([character, X_main, Y_main, rels])
        } 

        // Final X Y coords have been determined by now: console.log("assigned X Y", X_main, Y_main)  

        //*** Let's also assign the X Y for the persons related to this character! ***/ 
        var direction = "left"  // <- alternates to create "centered" effect 
        var love_node_direction = "left"

        //Goal: assign X Y for others + also calculate position of (Marriage, love, troubled love) nodes 
        for (const [rel_type, person] of rels) { 

            // If already in list... then don't assign
            var already_done = false
            for (const [character_name, , , ] of characters_X_Y) { 
                if (person == character_name) {
                    already_done = true
                    break
                }
            }

            var X = X_main 
            var Y = Y_main 
            
            if (rel_type == "ADOPTIVE_CHILD_OF" || rel_type == "DAUGHTER_OF" || rel_type == "SON_OF") {
                Y -= 500
            } else if  (rel_type == "FATHER_OF" || rel_type == "MOTHER_OF") {
                X += 250
                Y += 1000 
            } else {
                Y += 500
            }

            if (direction == "left") {
                X -= 250
            } else {
                X += 250 
            }

            // ***** Assigning LOVE NODES ***** //
            // For: love_nodes_X_Y

            var node_X = X_main - 25
            var node_Y = Y_main + 125
            if ((rel_type == "LOVER_OF" || rel_type == "HUSBAND_OF" || rel_type == "TROUBLED_LOVER_OF") && gender_dict[character] == "male") {
                while (X_Y_coords[[node_X, node_Y]]) { 
                    node_Y += 10
                    if (love_node_direction == "left") {
                        node_X -= 50
                    } else { // "right"
                        node_X += 50
                    }
                } 
                love_nodes_X_Y.push([character, person, rel_type, node_X, node_Y])
                X_Y_coords[[node_X, node_Y]] = true 
            } 

            if (love_node_direction == "left") {
                love_node_direction = "right"
            } else { 
                love_node_direction = "left"
            }

            if (already_done) {
                continue
            }

            //********// //********// //********// //********// //********//

            // If not yet done, ASSIGN XY coords!! 

            while (X_Y_coords[[X, Y]]) { //loop "towards direction" until spot not taken
                if (direction == "left") {
                    X -= 500
                } else { // "right"
                    X += 500
                }
            } 

            var person_rels; //find this person's relationships 
            for (const [c, r] of pop_copy) {
                if (person == c) {
                    person_rels = r
                    break
                }
            } 

            X_Y_coords[[X, Y]] = true
            characters_X_Y.push([person, X, Y, person_rels])


            if (direction == "left") {
                direction = "right"
            } else { 
                direction = "left"
            }
        }

        //We can finally move this guy out of popularity 
        popularity.splice(0,1)
    }
    
    // Adjust every node's Y
    for (let l of characters_X_Y) {
        l[2] = l[2] + Math.abs(l[1]) / 250 * 50  
    }

    for (let ln of love_nodes_X_Y) {
        ln[4] = ln[4]*1.05 + Math.abs(ln[3]) / 250 * 50 + 50
    } 

    return [characters_X_Y, resGraph2, love_nodes_X_Y, jp_dict, color_dict, gender_dict] 
}

//*******//   //*******//   //*******//   //*******//   //*******//






export function generateTimeline(timeline_info) {

    var info = []
    var i = 0;
    for (const [
        name,
        color,
        japanese_name,
        chapter_name,
        chapter_number,
        age_of_genji,
        birth,
        english,
        japanese,
        month,
        day,
        spring,
        summer,
        fall,
        winter,
        autumn,
    ] of timeline_info) {
        i += 1
		info.push(
            {
				name: name,
                color: color,
				jp_name: japanese_name,
				chapter: chapter_name,
                chapter_number: chapter_number,

				age_of_genji: parseInt(age_of_genji),
				birth: birth,
				english: english,
				japanese: japanese,
				month: parseInt(month),
				day: parseInt(day), 

				spring: spring,
				summer: summer,
				fall: fall,
				winter: winter,
                autumn: autumn,
                id: ("event_" + i.toString()), 
			} 
        )
	}
    //console.log(info)
    
    return info
}

export function singleCharacterTimeline(timeline_info) {

    var info = []
    var i = 0;
    for (const [
        chapter_name,
        chapter_number,
        age_of_genji,
        birth,
        english,
        japanese,
        month,
        day,
        spring,
        summer,
        fall,
        winter,
        autumn,
    ] of timeline_info) {
        i += 1
		info.push(
            {
                id: ("event_" + i.toString()), 
				chapter: chapter_name,
                chapter_number: chapter_number,

				age_of_genji: parseInt(age_of_genji),
				birth: birth,
				english: english,
				japanese: japanese,
				month: parseInt(month),
				day: parseInt(day), 

				spring: spring,
				summer: summer,
				fall: fall, 
				winter: winter,
                autumn: autumn 
			}
        )
	}
    // console.log(info)
    
    return info
}


export function generateLocations(location_info) {

    var info = []
    for (const [
        pnum,
        Japanese,
        notes,
        Romaji,
        name,
        speaker
    ] of location_info) {
		info.push(
            {
				pnum: pnum,
                japanese: Japanese,
                notes: notes,
                romaji: Romaji,
                location_name: name,
                speaker: speaker
			}
        )
	}
    
    
    return info
}
  

//****************************//

const utils = { toNativeTypes, valueToNativeType, getChpList, generateGeneology, concatObj, getPoemTableContent, sortPnumsFromObjList, generateTimeline, generateLocations, singleCharacterTimeline}
export default utils;
