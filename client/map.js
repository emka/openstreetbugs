var map = null;

/* This function creates a slippy map in div_id with an osm mapnik 
 * base layer centred on lon, lat at zoom. It returns a reference
 * to the new map object.
 */
function init_map(div_id, lon, lat, zoom)
{
	map = new OpenLayers.Map(div_id, {
		controls: [
			new OpenLayers.Control.Navigation(),
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.ScaleLine(),
			new OpenLayers.Control.Attribution()
		],
		maxResolution: 156543.0339,
		numZoomLevels: 20,
		units: 'm',
		projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326")
	});

	var mapnik = new OpenLayers.Layer.OSM.Mapnik("OpenStreetMap", {
		displayOutsideMaxExtent: true,
		wrapDateLine: true
	});
	map.addLayer(mapnik);

	map.setCenter(new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), zoom);

	return map;
}
