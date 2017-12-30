    function main() {
        
        //Show tile only within City of Edmonton
        //used BoundaryCanvas Leaflet plugin
        d3.json("./data/Edmonton_Boundary.geojson", function(data) {

            //my custom objects, attributes: filePath(str) and colors(array)
            //colors from http://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3
            var objects = [
                            {
                                filePath: "./data/Edmonton_wards.json",
                                colors:   ['#67001f','#b2182b','#d6604d','#f4a582','#fddbc7','#f7f7f7','#d1e5f0','#92c5de','#4393c3','#2166ac','#053061']
                            }, 

                            { 
                                filePath: "./data/Edmonton_neighbourhoods.json",
                                colors:   ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695']
                            }, 

                            {
                                filePath: "./data/Edmonton_zoning.json",
                                colors:   ['#d53e4f','#f46d43','#fdae61','#fee08b','#ffffbf','#e6f598','#abdda4','#66c2a5','#3288bd']
                            }
                        ],
                leaflet      = makeMap("edmonton-map", 10.45),
                tiledLeaflet = makeMap("edmonton-tile", 10),
                tileMap,
                button,
                map;

            tileMap = tiledLeaflet.map;

            //make tile within edmonton bounds
            L.TileLayer.boundaryCanvas('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                boundary: data.geometries[0],
                minZoom: 10
            }).addTo(tileMap);

            //add button to first map
            button       = L.control({position: "topleft"});
            button.onAdd = function(map){
                this._div           = L.DomUtil.create("div", "mybutton");
                this._div.innerHTML = "<p class='button-info'><strong><a href='related.html' "+
                                    "title='Separate views for Edmonton Neighbourhoods, Wards, & Zoning Bylaw' id='label'>"+
                                    "Seperate Views</a></strong></p>";
                return this._div;
            };

            button.addTo(tileMap);
            
            //apply overlays to map
            objects.forEach(function(d) { svgOVerlay(d.filePath, d.colors); });


            //map variable to get the overlays(e's)
            map = leaflet.map;


            //to get all the layers including the zoning layer
            setTimeout(layerControl, 2000);
            

            //add the contol layer to the map (it's done after the promise for each file is done)
            //the zoning json promise takes a while
            function layerControl() {

                //http://leafletjs.com/examples/layers-control/ --leaflet tutorial
                var myLayers        = Object.values(map._layers),
                    featureOverlays = myLayers.filter(function(e){ if( e.hasOwnProperty("selection") ) return e; }),
                    search          = d3.map(featureOverlays, function(e){ return e.selection[0][0].childElementCount; }),
                    baseOverlay     = {"neighbourhoods": search.get(394)},
                    overlayMaps     = {
                        "wards": search.get(12),
                        "zoning":search.get(1000)
                    };

                L.control.layers(baseOverlay, overlayMaps).addTo(map);
            }

            //-------------------------------------------------------------------------------------------------------
            //initializes a leaflet map and retruns the map
            function makeMap(id, zoom) {

                var northEast = L.latLng(53.77225408641424, -113.25668334960938),
                    southWest = L.latLng(53.315287860180106, -113.72634887695312),
                    bounds    = L.latLngBounds(southWest, northEast),
                    map       = L.map(id, {center: [53.5570, -113.4909], zoom: zoom, minZoom: zoom, maxBounds: bounds});

                    return {map: map};
            }

            //turns my custom objects to overlays on the leaflet map
            //using the L.d3SvgOverlay Leaflet plugin
            function svgOVerlay(filePath, colors) {

                d3.json(filePath, function(json) {

                    //http://bl.ocks.org/xEviL/0c4f628645c6c21c8b3a(L.d3SvgOverlay Geojson example)
                    //I made custom json object
                    //make overlay
                    var features        =  json.data.map(function(d){ return d["the_geom"]; }),
                        colorScale      = d3.scale.quantize()
                                            .domain([0, json.data.length -1])
                                            .range(colors),
                        featuresOverlay = L.d3SvgOverlay(function(sel, proj) {

                            var upd =  sel.selectAll("path").data(features);
                            upd.enter().append("path")
                            .attr({
                                    d:              proj.pathFromGeojson,
                                    stroke:         "#6e6a6a",
                                    fill: function(d, i){ return colorScale(i);},
                                    "fill-opacity": 0.65,
                                    "stroke-width": 1 / (proj.scale)
                                })
                            .append("title")
                            .html(tipHtml);
                            });

                    //adding overlay to map
                    featuresOverlay.addTo(leaflet.map);

                    
                    //apply tiphtml for each path
                    function tipHtml(d, i) {
                        
                        var object = json.data[i];
                        switch (filePath) {
                            case "./data/Edmonton_zoning.json":
                                return object["zoning"] + "</br>" + object["descript"];
                                break;
                        
                            default:
                            return object["name"] + "</br>" + parseFloat(object["area_km2"]).toFixed(3)+" "+"km&#94;"+"2";
                                break;
                        }
                    };//tip html
                    
                });//json

            }//svgOverlay
            //-------------------------------------------------------------------------------------------------------

        });//Edmonton Boundary

    }//main

    window.onload = main;