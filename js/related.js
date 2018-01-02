    function main(){

        //http://www.geonet.ch/basic-leaflet-map-with-d3-overlay/ --saw this to understand queue
        queue()
               .defer(d3.json, "./data/Edmonton_Boundary.geojson")//load Edmonton border
               .defer(d3.json, "./data/Edmonton_wards.json")//load Edmonton Wards
               .defer(d3.json, "./data/Edmonton_neighbourhoods.json")//load Edmonton Neighbourhoods
               .defer(d3.json, "./data/Edmonton_zoning.json")//load Edmonton Zoning Bylaw
               .await(dataProcessor)

        function dataProcessor(error, border, wards, neighbourhoods, zones) {
            if(error) throw error;
            var maps = [
                        {id:    "ward-map", 
                        file:   wards,
                        colors: ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061']
                        }, 

                        {id:    "neighbourhood-map", 
                        file:   neighbourhoods,
                        colors: ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']
                        }, 

                        {id:   "bylaw-zoning-map",
                        file:   zones,
                        colors: ['#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd']
                        }
                       ],
                wardMap,
                button;


            //add leaflet map to each object
            //apply overlays to map
            maps.forEach(function(d){
                d.leaflet = makeMap(d.id);
                svgOVerlay(d.file, d.id, d.colors);
            });

            //add button to first map
            wardMap = maps[0].leaflet.map;
            button  = L.control({position: "topleft"});
                button.onAdd  = function(map){
                    this._div           = L.DomUtil.create("div", "mybutton");
                    this._div.innerHTML = "<p class='button-info'><strong><a href='index.html' "+
                                        "title='Layered view for Edmonton Neighbourhoods, Wards, & Zoning Bylaw' "+
                                        "id='label'>Layered View</a></strong></p>";
                    return this._div;
                };
            button.addTo(wardMap);

            //----------------------------------------------------------------------
            function makeMap(id) {
                var northEast = L.latLng(53.77225408641424, -113.25668334960938),
                    southWest = L.latLng(53.315287860180106, -113.72634887695312),
                    bounds    = L.latLngBounds(southWest, northEast),
                    map       = L.map(id, {center: [53.5444, -113.4909], zoom: 10, minZoom: 10, maxBounds: bounds} ),
                    //make tile within edmonton bounds
                    tiles     = L.TileLayer.boundaryCanvas('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
                    {
                        attribution:     '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                        boundary:         border.geometries[0],
                    }).addTo(map);

                return {map: map};
            }

            function svgOVerlay(file, id, colors) {
                
                    //http://bl.ocks.org/xEviL/0c4f628645c6c21c8b3a(L.d3SvgOverlay Geojson example)
                    //I made custom json object
                    //make overlay
                    var features        = file.data.map(function(d){ return d["the_geom"]; }),
                        searchIds       = d3.map(maps, function(d) { return d.id; }),
                        colorScale      = d3.scale.quantize()
                                            .domain([0, file.data.length -1])
                                            .range(colors),
                        featuresOverlay = L.d3SvgOverlay(function(sel, proj){

                            var upd =  sel.selectAll("path").data(features);
                            upd.enter().append("path")
                            .attr({
                                d:              proj.pathFromGeojson,
                                stroke:         "#6e6a6a",
                                fill: function(d, i){ return colorScale(i);},
                                "fill-opacity": 0.60,
                                "stroke-width": 1 / (proj.scale) * 0.7
                            })
                            .append("title")
                            .html(tipHtml);
                        });

                    //adding overlay to map
                    featuresOverlay.addTo(searchIds.get(id).leaflet.map);

                    //apply tiphtml for each path
                    //used id attribute to assign tip html
                    function tipHtml(d, i) {
                        
                        var object = file.data[i];
                        switch (id) {
                            case "bylaw-zoning-map":
                                return object["zoning"] + "</br>" + object["descript"];
                                break;
                        
                            default:
                            return object["name"] + "</br>" + parseFloat(object["area_km2"]).toFixed(3)+" "+"km&#94;"+"2";
                                break;
                        }
                    };//tip html
                    
            }//svgOverlay
            
        }//dataProcessor
 
    }//main

    window.onload = main;
