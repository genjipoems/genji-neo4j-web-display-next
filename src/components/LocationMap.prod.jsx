import React, { useState } from "react";
import L from 'leaflet';
import * as d3 from 'd3';
import '../styles/pages/locationMap.css'



const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 2
});

// 2. Define the dimensions of your fictional map image (in pixels)
const mapWidth = 2048;
const mapHeight = 1536;
const bounds = [[0, 0], [mapHeight, mapWidth]];

// 3. Add your custom fictional map background
L.imageOverlay('/path-to-your-fictional-map-image.png', bounds).addTo(map);
map.fitBounds(bounds);


const svgLayer = d3.select(map.getPanes().overlayPane).append("svg");
const g = svgLayer.append("g").attr("class", "leaflet-zoom-hide");

function updateD3Overlay(apiData) {
    // Assuming apiData format: { compCoords: [y, x], receiptCoords: [y, x], ... }
    const { compCoords, receiptCoords } = apiData; 
    
    if (!compCoords || !receiptCoords) return;

    // Convert flat XY map coordinates into dynamic Leaflet screen pixel positions
    const startPoint = map.latLngToLayerPoint(L.latLng(compCoords));
    const endPoint = map.latLngToLayerPoint(L.latLng(receiptCoords));

    const lineData = [{ start: startPoint, end: endPoint }];

    // Bind data and draw/update travel paths using D3
    const links = g.selectAll(".poem-delivery")
        .data(lineData);

    links.enter()
        .append("line")
        .attr("class", "poem-delivery")
        .merge(links)
        .attr("x1", d => d.start.x)
        .attr("y1", d => d.start.y)
        .attr("x2", d => d.end.x)
        .attr("y2", d => d.end.y)
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "5,5"); // Gives it a nice dotted messenger path look

    links.exit().remove();
}

// Reset SVG dimensions and paths whenever the user zooms or pans
map.on("zoomend moveend", () => {
    const topLeft = map.latLngToLayerPoint(map.getBounds().getNorthWest());
    const bottomRight = map.latLngToLayerPoint(map.getBounds().getSouthEast());

    svgLayer.attr("width", bottomRight.x - topLeft.x)
            .attr("height", bottomRight.y - topLeft.y)
            .style("left", topLeft.x + "px")
            .style("top", topLeft.y + "px");

    g.attr("transform", `translate(${-topLeft.x}, ${-topLeft.y})`);    
    // Re-run your drawing function to align coordinates accurately
    if (currentApiData) updateD3Overlay(currentApiData);
});

















class Building { //Labeled edge
    constructor(type, coordinates, vB, width, height, fill, stroke, pts, jpText, enText, jpSize, enSize, the) {
        this.type = type
        this.coordinates = coordinates
        this.viewBox = (vB[0][0]-1).toString() + " " + vB[0][1] + " " + (vB[1][0]+2).toString() + " " + vB[1][1]

        this.width = width
        this.height = height
        this.fill = fill
        this.stroke = stroke

        this.d = ""

        for (let i = 0; i < pts.length; i++) {
        const x = pts[i][0]
        const y = pts[i][1]
        if (i == 0) {
            this.d += "M " + x.toString() + " " + y.toString() + " "
        } else {
            this.d += "L " + x.toString() + " " + y.toString() + " "
        }
        }

        this.d += "L " + pts[0][0] + " " + pts[0][1] + "Z"

        this.jpText = jpText
        this.enText = enText
        this.jpSize = jpSize
        this.enSize = enSize
        this.the = the
    }
}

class Shape {
  constructor(type, coordinates, vB, width, height, fill, stroke, pts) {
        this.type = type
        this.coordinates = coordinates
        this.viewBox = vB[0][0] + " " + vB[0][1] + " " + vB[1][0] + " " + vB[1][1]

        this.width = width
        this.height = height
        this.fill = fill
        this.stroke = stroke

        this.d = ""

        for (let i = 0; i < pts.length; i++) {
        const x = pts[i][0]
        const y = pts[i][1]
        if (i == 0) {
            this.d += "M " + x.toString() + " " + y.toString() + " "
        } else {
            this.d += "L " + x.toString() + " " + y.toString() + " "
        }
        }

        this.d += "L " + pts[0][0] + " " + pts[0][1] + "Z"
  }
}

class Circle {
    constructor(type, coordinates, vB, width, height, fill, stroke, radius, jpText, enText, jpSize, enSize) {
        this.type = type
        this.coordinates = coordinates
        this.viewBox = vB[0][0] + " " + vB[0][1] + " " + vB[1][0] + " " + vB[1][1]
        this.width = width
        this.height = height
        this.fill = fill
        this.stroke = stroke
        this.radius = radius
        this.jpText = jpText
        this.enText = enText
        this.jpSize = jpSize
        this.enSize = enSize
    }
}

export default function CharacterMap({l}) { 
    
    const dictionary = {}

    for (const {pnum, japanese, notes, romaji, location_name, speaker} of l) {
        if (dictionary[location_name] == undefined) {
            dictionary[location_name] = []
        }
        dictionary[location_name].push({
            pnum: pnum,
            japanese: japanese,
            notes: notes,
            romaji: romaji,
            speaker: speaker
        })
    }

    console.log(dictionary)

    const vectors = [
        new Shape("hallway", [31,9.5], [[0,0], [125,100]], "80px", "80px", "#f2cb3f", "black", [[0,0], [15, 0], [15,42], [0,42]]),
        new Shape("hallway", [18.5,9.5], [[0,0], [125,100]], "80px", "80px", "#f2cb3f", "black", [[0,0], [15, 0], [15,42], [0,42]]),
        new Shape("hallway", [6,9.5], [[0,0], [125,100]], "80px", "80px", "#f2cb3f", "black", [[0,0], [15, 0], [15,42], [0,42]]),
        new Shape("hallway", [30.75,33], [[0,0], [125,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [15, 0], [15,25], [0,25]]),
        new Shape("hallway", [18.3,33], [[0,0], [125,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [15, 0], [15,25], [0,25]]),
        new Shape("hallway", [6,33], [[0,0], [125,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [15, 0], [15,25], [0,25]]),
        new Shape("hallway", [-32,45], [[0,0], [125,101]], "100px", "80px", "#f2cb3f", "black", [[0,0], [102, 0], [102,15], [15,15], [15,35], [0,35]]),
        new Shape("hallway", [-51,90], [[0,0], [250,185]], "350px", "120px", "#f2cb3f", "black", [[115,0], [135, 0], [135,125], [250,125], [250,145], [135,145], [135,185], [115,185], [115,145], [0,145], [0,125], [115,125]]),
        new Shape("hallway", [-16.5,93.5], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [45, 0], [45,10], [0,10]]),
        new Shape("hallway", [35,102], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [55, 0], [55,10], [0,10]]),
        new Shape("hallway", [64,102], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [55, 0], [55,10], [0,10]]),
        new Shape("hallway", [34,109.5], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [55, 0], [55,10], [0,10]]),
        new Shape("hallway", [-19,109.5], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [54.5, 0], [54.5,10], [0,10]]),
        new Shape("hallway", [39.5,45], [[0,0], [125,101]], "100px", "80px", "#f2cb3f", "black", [[0,0], [102, 0], [102,35], [87,35], [87,15], [0,15]]),
        new Shape("hallway", [-24,100], [[0,0], [50,50]], "80px", "80px", "#f2cb3f", "black", [[0,0], [5, 0], [5,7.5], [0,7.5]]),
        new Shape("hallway", [-52,56.5], [[0,0], [100,100]], "150px", "150px", "#f2cb3f", "black", [[0,43], [5,43], [5,0], [12.5,0], [12.5,43], [25,43],[25,48],[0,48] ]),
        new Shape("hallway", [-53,89], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,40.5], [0,40.5]]),
        new Shape("hallway", [-75,89], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,40.5], [0,40.5]]),
        new Shape("hallway", [-75,109.15], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,50.5], [0,50.5]]),
        new Shape("hallway", [-56,18], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [28, 0], [28,6], [0, 6]]),
        new Shape("hallway", [-56,-2], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [28, 0], [28,6], [0, 6]]),
        new Shape("hallway", [78,52.5], [[0,0], [100,100]], "150px", "150px", "#f2cb3f", "black", [[0,33], [12.5,33], [12.5,0], [19.5,0], [19.5,33], [25,33],[25,38],[0,38] ]),
        new Shape("hallway", [73.75,18], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [28, 0], [28,6], [0, 6]]),
        new Shape("hallway", [73.75,-2], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [28, 0], [28,6], [0, 6]]),
        new Shape("hallway", [83,76.5], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,19.5], [0,19.5]]),
        new Shape("hallway", [103,76.5], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,19.5], [0,19.5]]),
        new Shape("hallway", [93,100], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,22.5], [0,22.5]]),
        new Shape("hallway", [103,108.65], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [7.5, 0], [7.5,19.5], [0,19.5]]),
        new Shape("hallway", [-25.15,-19.5], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [54.5, 0], [54.5,15], [0,15]]),
        new Shape("hallway", [40.45,-19.5], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [54.5, 0], [54.5,15], [0,15]]),
        new Shape("hallway", [-37,-56.65], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [13.5, 0], [13.5,29.5], [0,29.5]]),
        new Shape("hallway", [63,-56.65], [[0,0], [60,60.5]], "100px", "80px", "#f2cb3f", "black", [[0,0], [13.5, 0], [13.5,29.5], [0,29.5]]),
        new Shape("hallway", [64,59.5], [[0,0], [100,100]], "100px", "80px", "#f2cb3f", "black", [[0,0], [55, 0], [55,10], [0,10]]),
        new Shape("", [-94,113.5], [[0,0], [250,350]], "250px", "350px", "#b2d1d6", "black", [[0,0], [235, 0], [235,20], [20,20], [20,350], [0,350]]),
        new Shape("", [-94,3.5], [[0,0], [250,350]], "250px", "350px", "#b2d1d6", "black", [[0,0], [20, 0], [20,330], [235,330], [235,350], [0,350]]),
        new Shape("", [32,113.5], [[0,0], [250,350]], "250px", "350px", "#b2d1d6", "black", [[15,0], [250, 0], [250,350], [230,350], [230,20], [15,20]]),
        new Shape("", [32,3.5], [[0,0], [250,350]], "250px", "350px", "#b2d1d6", "black", [[230,0], [250, 0], [250,350], [15,350], [15,330], [230,330]]),

        new Building("building", [-4,0], [[0,0], [150,100]], "120px", "100px", "#d99deb", "black", [[0,0],  [150, 0], [150, 75], [125, 75], [125, 90], [25, 90], [25, 75], [0, 75]], "紫宸殿", "Shishinden", "20px", "15px", true),
        new Building("building", [0,30.5], [[0,0], [125,85]], "100px", "90px", "#FFA500", "black", [[0,0], [125, 0], [125, 55], [115, 55], [115, 65], [15, 65], [15, 55], [0, 55]], "仁壽殿", "Jijuden", "20px", "15px", true),
        new Building("building", [0,55.5], [[0,0], [125,80]], "100px", "100px", "#ffabfc", "black", [[0,15], [15,15], [15,0], [110,0], [110,15], [125,15], [125,65] , [0,65]], "承香殿", "Jōkyōden", "20px", "15px", true),
        new Building("building", [-50,38], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,275], [0,275]], "清涼殿", "Seiryōden", "30px", "14px", true),
        new Building("building", [0,105.85], [[0,0], [125,70]], "100px", "100px", "#ffabfc", "black", [[0,0], [125,0], [125,55], [0,55]], "常寧殿", "Jōneiden", "20px", "15px", true),
        new Building("building", [-40.75,97.5], [[0,0], [85,257]], "100px", "125px", "#ffabfc", "black", [[0,0], [85,0], [85,243], [0,243]], "弘徽殿", "Kokiden", "30px", "16px", true),
        new Building("building", [42,110.55], [[0,0], [65,200]], "100px", "107px", "#ffabfc", "black", [[0,0], [65,0], [65,175], [0,175]], "宣耀殿", "Senyōden", "22px", "13px", true),
        new Building("building", [40.5,97.5], [[0,0], [85,257]], "100px", "125px", "#ffabfc", "black", [[0,25], [15,25], [15,0], [85,0], [85,243], [0,243]], "麗景殿", "Reikeiden", "32px", "16px", true),
        new Building("building", [84.5,107.65], [[0,0], [85,70]], "70px", "80px", "#ffabfc", "black", [[0,0], [85,0], [85,55], [0,55]], "淑景舎", "Shigeisha", "15px", "10px", true),
        new Building("building", [-42,110.55], [[0,0], [65,200]], "100px", "107px", "#ffabfc", "black", [[0,0], [65,0], [65,175], [0,175]], "登華殿", "Tōkaden", "22px", "13px", true),
        new Building("building", [2,112], [[0,0], [125,70]], "90px", "100px", "#ffabfc", "black", [[0,0], [125,0], [125,55], [0,55]], "常寧殿", "Jōneiden", "20px", "15px", true),
        new Building("building", [50,38], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,275], [0,275]], "綾綺殿", "Ryōkiden", "30px", "14px", true),
        new Building("building", [-80,38], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,275], [0,275]], "後涼殿", "Kōrōden", "30px", "14px", true),
        new Building("building", [80,38], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,275], [0,275]], "温明殿", "Unmeiden", "30px", "14px", true),
        new Building("building", [-76.5,74.65], [[0,0], [100,70]], "85px", "90px", "#ffabfc", "black", [[0,0], [100,0], [100,55], [20,55], [20,75], [0,75]], "飛香舎", "Higyōsha", "15px", "12px", true),
        new Building("building", [-74,104.65], [[0,0], [100,70]], "75px", "90px", "#ffabfc", "black", [[0,0], [100,0], [100,55], [0,55]], "凝花舎", "Gyōkasha", "15px", "10px", true),
        new Building("building", [-74,112.65], [[0,0], [90,70]], "75px", "90px", "#ffabfc", "black", [[0,0], [90,0], [90,55], [0,55]], "龍芳舎", "Shūhōsha", "15px", "10px", true),
        new Building("building", [84.5,69.65], [[0,0], [85,90]], "70px", "80px", "#ffabfc", "black", [[0,0], [85,0], [85,70], [0,70]], "昭陽舍", "Shōyōsha", "15px", "10px", true),
        new Building("building", [84.5,97.65], [[0,0], [85,50]], "70px", "80px", "#ffabfc", "black", [[0,0], [85,0], [85,40], [0,40]], "昭陽北舎", "Shōyōhokusha", "15px", "8px", true),
        new Building("building", [84.5,112.2], [[0,0], [85,70]], "70px", "80px", "#ffabfc", "black", [[0,0], [85,0], [85,55], [0,55]], "淑景北舎", "Shigeihokusha", "15px", "10px", true),
        new Building("building", [-50, -17.5], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,275], [0,275]], "校書殿", "Kyōshoden", "30px", "14px", true),
        new Building("building", [52.5,-17.5], [[0,0], [125,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [125,0], [125,200], [100,200], [100,275], [0,275]], "綾綺殿", "Ryōkiden", "35px", "18px", true),
        new Building("building", [50,-67.5], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,250], [75,250], [75,275], [25,275], [25,250], [0,250]], "春興殿", "Shunkyōden", "35px", "18px", true),
        new Building("building", [-50,-67.5], [[0,0], [100,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [100,0], [100,250], [75,250], [75,275], [25,275], [25,250], [0,250]], "安風殿", "Anpukuden", "35px", "18px", true),
        new Building("building", [-78,-17.5], [[0,0], [125,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [65,0], [65,25], [125,25], [125,275], [0,275]], "蔵人町屋", "Kurōdomachiya", "35px", "17px", false),
        new Building("building", [-94.75,28.05], [[0,0], [50,140]], "25px", "65px", "#98a5b3", "black", [[0,0], [47.5,0], [47.5,125], [0, 125]], "陰明門", "Onmeimon Gate", "17px", "12px", false),
        new Building("building", [125.75,28.05], [[0,0], [50,140]], "25px", "65px", "#98a5b3", "black", [[0,0], [47.5,0], [47.5,125], [0, 125]], "宣陽門", "Senyōmon Gate", "17px", "12px", false),
        new Building("building", [3.75,-103.35], [[0,0], [165,60]], "80px", "80px", "#98a5b3", "black", [[0,0], [165,0], [165,43.5], [0, 43.5]], "承明門", "Shōmeimon Gate", "17px", "12px", false),
        new Building("building", [3.75,114.65], [[0,0], [165,60]], "80px", "80px", "#98a5b3", "black", [[0,0], [165,0], [165,43.5], [0, 43.5]], "玄輝門", "Genkimon Gate", "17px", "12px", false),
        new Building("building", [-73.5,-67.5], [[0,0], [70,300]], "100px", "125px", "#ffabfc", "black", [[0,0], [70,0], [70,250], [0,250]], "進物所", "Palace Kitchen", "24px", "10px", false),
        new Building("building", [-82.5,-50.5], [[0,0], [130,100]], "45px", "40x", "#ffabfc", "black", [[0,0], [130,0], [130,75], [0,75]], "造物所", "Palace Workshop", "24px", "12px", false),
        new Building("building", [-90.5,-67.5], [[0,0], [70,250]], "100px", "100px", "#ffabfc", "black", [[0,0], [70,0], [70,200], [0,200]], "造物所", "Palace Workshop", "24px", "9px", false),
        new Building("building", [87.5,-27.5], [[0,0], [125,170]], "75px", "75px", "#ffabfc", "black", [[0,0], [125,0], [125,125], [0,125]], "御興宿", "Portable Shrine", "30px", "12px", false),
        new Building("building", [88.5,-77.5], [[0,0], [125,170]], "65px", "65px", "#ffabfc", "black", [[0,0], [125,0], [125,125], [0,125]], "朱器殿", "Jūkiden", "30px", "12px", true),

        new Circle("circle", [-10, -40], [[0,0], [80,110]], "40px", "40px", "#06c24e", "black", "40", "橘", "Tangerine tree", "30px", "12px"),
        new Circle("circle", [35, -40], [[0,0], [80,110]], "40px", "40px", "#ff63f2", "black", "40", "桜", "Cherry tree", "30px", "12px"),
    ];  
    
    const projection = geoPatterson()
    
    const [position, setPosition] = useState({ coordinates: [20, 5], zoom: 1.95 });

    function handleZoomIn() {
        setPosition((pos) => ({ ...pos, zoom: pos.zoom * 2 }));
    }

    function handleZoomOut() {
        setPosition((pos) => ({ ...pos, zoom: pos.zoom / 2 }));
    }

    function handleMoveEnd(position) {
        setPosition(position);
    }

    function handleHover(location, id_name, og_color) {
        document.getElementById(id_name).style.fillOpacity = "50%"
        if (dictionary[location] !== undefined) {
            document.getElementById(id_name).style.fill = "#00FFFF"
        }
    }

    function lookUpPoems(location) {
        if (dictionary[location] !== undefined) {
            document.getElementById('popup-box').style.display = "flex"

            // replace name:
            document.getElementById("place_name").innerHTML = location 

            // get poems: 
            var poems = document.getElementById("poems")
            poems.innerHTML = "" //clean up

            var p_num = document.createElement("span")
            p_num.innerHTML = " " + "<br>"
            poems.appendChild(document.createElement("span"))

            for (const {pnum, japanese, notes, romaji, location_name, speaker}  of dictionary[location]) {
                poems.appendChild(document.createElement("hr"))

                var chapter = pnum.substring(0, 2)
                var poem_num = pnum.substring(4, 6)

                var p_num = document.createElement("h4")
                p_num.fontWeight = "none"
                p_num.innerHTML = "Chapter " + chapter  + " | Speaker: " + "<span style=\" font-weight: bold\">" + speaker + "<\span>"
                p_num.style.marginTop = "3px" 
                p_num.style.marginLeft = "0" 
                poems.appendChild(p_num)

                var jp_poem = document.createElement("h4")
                jp_poem.innerHTML = japanese.replaceAll("\n", "<br>"); 
                jp_poem.lang = "ja"
                jp_poem.className = "vertical"
                jp_poem.style.marginLeft = "0" 
                jp_poem.style.marginBottom = "0" 
                poems.appendChild(jp_poem)

                poems.appendChild(document.createElement("br"))

                var rmji = document.createElement("p")
                rmji.innerHTML = romaji.replaceAll("\n", "<br>"); 
                rmji.style.marginLeft = "0" 
                rmji.style.marginBottom = "0" 
                poems.appendChild(rmji)

                poems.appendChild(document.createElement("br"))

                var ns = document.createElement("p")
                ns.innerHTML = notes; 
                ns.style.fontFamily = "serif"; 
                ns.style.marginLeft = "0" 
                ns.style.marginBottom = "0" 
                poems.appendChild(ns)

                poems.appendChild(document.createElement("br"))

                var a_url = document.createElement("a")
                a_url.innerHTML = "More details"
                a_url.target = "_blank"
                if (chapter.substring(0,1) == "0") {
                    chapter = chapter.substring(1, 2) 
                }
                if (poem_num.substring(0,1) == "0") {
                    poem_num = poem_num.substring(1, 2) 
                }
                a_url.href = `/poems/${chapter}/${poem_num}`
                a_url.className = "a_hv"
                poems.appendChild(a_url)


                var new_line = document.createElement("p")
                new_line.innerHTML = "<br>"
                poems.appendChild(new_line)
            }
        }
    }

    return (
        <div>
            <div style={{paddingTop: "30px"}}>
                <ComposableMap
                    height={350}
                    projection={projection} projectionConfig={{ rotate: [-10, 0, 0], scale: 4000}}
                >
                    <ZoomableGroup
                    maxZoom={10000}
                    minZoom={0.35}
                    zoom={position.zoom}
                    center={position.coordinates}
                    onMoveEnd={handleMoveEnd}
                    >
                    {
                        vectors.map((v) => {
                        if (v.type == "building") {
                            return (
                            <Marker coordinates={v.coordinates}>
                                <svg viewBox={v.viewBox} width={v.width} height={v.height}
                                    style={{
                                        filter: "drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7))",
                                        WebkitFilter: "drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7))"
                                    }}
                                    onMouseOver={(e) => handleHover(v.enText, "path" + v.coordinates.toString() + v.type, v.fill)}
                                    onMouseOut={(e) => {
                                        document.getElementById("path" + v.coordinates.toString() + v.type).style.fillOpacity = "100%"
                                        document.getElementById("path" + v.coordinates.toString() + v.type).style.fill = v.fill
                                    }}
                                    onClick={(e) => lookUpPoems(v.enText)}
                                >
                                <path id={"path" + v.coordinates.toString() + v.type} style={{fill: v.fill, stroke: v.stroke}} 
                                    
                                    d={v.d} strokeWidth="1.20"
                                />
                                <text x="50%" y ="34%" fontSize={v.jpSize} dominantBaseline="middle" textAnchor="middle" fontWeight="bold">
                                    {v.jpText}
                                </text>
                                <text x="50%" y ="52.5%" fontSize={v.enSize}  dominantBaseline="middle" textAnchor="middle" fontWeight="bold">
                                    {(v.the) ? <>{"The " + v.enText}</> : <>{v.enText}</>}
                                </text>
                                <g>
                                {
                                    (dictionary[v.enText] !== undefined) ? 
                                    dictionary[v.enText].map(() => {
                                        return <image opacity="70%" x={(Math.floor(Math.random() * 50) -1).toString() + "%"} y={(Math.floor(Math.random() * 60) + 1).toString()+ "%"} href="/images/location_pin.png" width="30%" height="30%" />
                                    })
                                    : <></>
                                }
                                </g>
                                </svg>
                            </Marker>
                            );
                        } else if (v.type == "circle") {
                            return (
                            <Marker coordinates={v.coordinates}>
                                <svg viewBox={v.viewBox} width={v.width} height={v.height}
                                    style={{
                                        filter: "drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7))",
                                        WebkitFilter: "drop-shadow( 3px 3px 2px rgba(0, 0, 0, .7))"
                                    }}
                                    onMouseOver={(e) => handleHover(v.enText, "path" + v.coordinates.toString() + v.type, v.fill)}
                                    onMouseOut={(e) => {
                                        document.getElementById("path" + v.coordinates.toString() + v.type).style.fillOpacity = "100%"
                                        document.getElementById("path" + v.coordinates.toString() + v.type).style.fill = v.fill
                                    }}
                                    onClick={(e) => lookUpPoems(v.enText)}
                                >
                                <circle id={"path" + v.coordinates.toString() + v.type} style={{fill: v.fill, stroke: v.stroke}}  cx={v.radius} cy={v.radius} r="50"/>
                                <text x="50%" y ="34%" fontSize={v.jpSize} dominantBaseline="middle" textAnchor="middle" fontWeight="bold">
                                    {v.jpText}
                                </text>
                                <text x="50%" y ="52.5%" fontSize={v.enSize}  dominantBaseline="middle" textAnchor="middle" fontWeight="bold">
                                    {v.enText}
                                </text>
                                </svg>
                            </Marker>
                            );
                        } else {
                            return (
                            <Marker coordinates={v.coordinates}>
                                <svg viewBox={v.viewBox} width={v.width} height={v.height} 
                                onMouseOver={(e) => {
                                    document.getElementById("text" + v.coordinates.toString() + v.type).innerHTML = v.type
                                    document.getElementById("path" + v.coordinates.toString() + v.type).style.fillOpacity = "50%"
                                }}
                                onMouseOut={(e) => {
                                    document.getElementById("text" + v.coordinates.toString() + v.type).innerHTML = ""
                                    document.getElementById("path" + v.coordinates.toString() + v.type).style.fillOpacity = "100%"
                                }}
                                >
                                <path id={"path" + v.coordinates.toString() + v.type} style={{fill: v.fill, stroke: v.stroke}} d={v.d} />
                                <text id={"text" + v.coordinates.toString() + v.type} x="32%" y ="15%" fontSize="15px"  dominantBaseline="middle" textAnchor="middle"></text>
                                </svg> 
                            </Marker>
                            );
                        }
                        })
                    }
                    </ZoomableGroup>
                </ComposableMap>
                <div className="controls">
                    <button onClick={handleZoomIn}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    </button>
                    <button onClick={handleZoomOut} id="bottom">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    </button>
                </div>
                <br></br>
            </div>
            <div id="popup-box" class="modal">
                <div class="main-box">
                    <button onClick={(e) => {document.getElementById('popup-box').style.display = "none"}} style={{fontSize: "30px"}}>&times;</button>
                    <div class="content" >
                        <h1 style={{fontFamily: "monospace", marginTop: "14px", textAlign: "left"}}><span id="place_name">Somewhere</span></h1>
                        <div id="poems" style={{fontFamily: "monospace", marginTop: "14px", textAlign: "left"}}>

                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
    
}
