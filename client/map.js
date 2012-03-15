var map = null;
var permalink = null;

function init_map(div_id, lon, lat, zoom)
{
	map = new OpenLayers.Map(div_id, {
		controls: [
			new OpenLayers.Control.Navigation(),
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.ScaleLine(),
			new OpenLayers.Control.LayerSwitcher()
		],
		maxResolution: 156543.0339,
		numZoomLevels: 20,
		units: 'm',
		projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326")
	});

	var layerMapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
	map.addLayer(layerMapnik);
	var layerCycleMap = new OpenLayers.Layer.OSM.CycleMap("CycleMap");
	map.addLayer(layerCycleMap);

	map.setCenter(new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), zoom);

	map.addControl(permalink=new OpenLayers.Control.Permalink());

	return map;
}

window.onload = init;
function init()
{
	/* get URI param "z" and set zoomlevel */
	var regex = new RegExp("[\\?&]z=([^&#]*)");
	var result = regex.exec(window.location.href);
	if(result == null)
		zoomlevel = 4;
	else
		zoomlevel = result[1];

        var map = init_map('map', 16.3, 46.53, zoomlevel);
        init_openstreetbugs(map, "/api/0.1/");
}
