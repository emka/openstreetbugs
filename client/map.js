var map = null;

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
	var layerTilesAtHome = new OpenLayers.Layer.OSM.Osmarender("Osmarender");
	map.addLayer(layerTilesAtHome);

	map.setCenter(new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), zoom);

	return map;
}

function init()
{
        var map = init_map('map', 16.3, 46.53, 4);
        init_openstreetbugs(map, "/api/0.1/");
}
