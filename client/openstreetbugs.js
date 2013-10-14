/*
 * Copyright 2008, 2009 Xavier Le Bourdon, Christoph Böhme, Mitja Kleider
 *
 * This file is part of Openstreetbugs.
 *
 * Openstreetbugs is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Openstreetbugs is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Openstreetbugs.  If not, see <http://www.gnu.org/licenses/>.
 */


/*
 * This file implements the client-side of openstreetbugs. To use it in an 
 * application simply add this file and call init_openstreetmap with a map
 * object and the path of the server-side scripts.
 * 
 * Please have a look at osb-example.html to see how to add openstreetbugs
 * to your website.
 */


/* 
 * Some utility functions
 */

/* Strip leading and trailing whitespace from str. 
 */
function strip(str)
{
	return str.replace(/^\s+|\s+$/g, "");
}

/* Escape html special characters in str.
 */
function escape_html(str)
{
	if(!(str instanceof String))
		str = str.toString();

	str = str.replace(/&/g, "&amp;");
	str = str.replace(/"/g, "&quot;");
	str = str.replace(/</g, "&lt;");
	str = str.replace(/>/g, "&gt;");
	str = str.replace(/'/g, "&#146;");
	return str;
}

/* Save value in a session cookie named "name".
 */
function set_cookie(name, value)
{
	var expires = (new Date((new Date()).getTime() + 604800000)).toGMTString(); // one week from now
	document.cookie = name+"="+escape(value)+";expires="+expires+";";
}

/* Retrieve the value of cookie "name".
 */
function get_cookie(name)
{
	if (document.cookie)
	{
		var cookies = document.cookie.split(";");
		for (var i in cookies)
		{
			c = cookies[i].split("=");
			if (strip(c[0]) == name) return unescape(strip(c[1]));
		}
	}
	return null;
}

/* These functions do some coordinate transformations
 */
function plusfacteur(a) { return a * (20037508.34 / 180); }
function moinsfacteur(a) { return a / (20037508.34 / 180); }
function y2lat(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(moinsfacteur(a)*Math.PI/180)) - Math.PI/2); }
function lat2y(a) { return plusfacteur(180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2))); }
function x2lon(a) { return moinsfacteur(a); }
function lon2x(a) { return plusfacteur(a); }
function lonLatToMercator(ll) { return new OpenLayers.LonLat(lon2x(ll.lon), lat2y(ll.lat)); }


/*
 * Html contents of the popups displayed by openstreetbug
 */

/* Changes all occurences of "<hr />" to </p><p class="Comment"> for proper markup of comments.
 */
function fix_markup(str)
{
	return str.replace(/<hr \/>/g, '</p><p class="Comment"><b>'+_('Comment:')+'</b> ');
}

/* Html markup for popups showing unresolved bugs.
 */
function popup_open_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);
	
	var description = '<h1>'+_('Unresolved Error')+'</h1><p><b>'+_('Description:')+'</b> '+fix_markup(bug.text)+'</p>';
	var action_comment = '<ul><li><a href="#" onclick="add_comment('+bug.id+'); return false;">'+_('Add comment')+'</a></li>';
	var action_edit = '<li><a href="http://www.openstreetmap.org/edit?lat='+bug.lat+'&amp;lon='+bug.lon+'&amp;zoom=17" target="_blank">'+_('Edit in Potlatch')+'</a></li>';
	var top = parseFloat(bug.lat)+0.002;
	var bottom = top - 0.004;
	var left = parseFloat(bug.lon-0.003);
	var right = left + 0.006;
	action_edit += '<li><a href="http://localhost:8111/load_and_zoom?top='+top+'&amp;bottom='+bottom+'&amp;left='+left+'&amp;right='+right+'" target="_blank">'+_('JOSM')+'</a></li>';
	var action_close = '<li><a href="#" onclick="close_bug('+bug.id+'); return false;">'+_('Mark as Fixed')+'</a></div></li></ul>';

	return description+action_comment+action_edit+action_close;
}

/* Html markup for popups showing fixed bugs.
 */
function popup_closed_bug(bug_or_id)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	var description = '<h1>'+_('Fixed Error')+'</h1><p><b>'+_('Description:')+'</b> '+fix_markup(bug.text)+'</p>';
	var note = '<p class="Note">'+_('This error has been fixed already. However, it might take a couple of days before the map image is updated.')+'</p>';

	return description+note;
}

/* Html markup for popups for new bug reports.
 */
function popup_add_bug(x, y, nickname)
{
	var intro_text = '<h1>'+_('Create an Error Report')+'</h1><p>'+_('Please provide a short description of what\'s wrong here. You can also enter your nickname to show that you found the error.')+'</p>';
	var form_header = '<form><div><input type="hidden" name="lon" value="'+x2lon(x)+'"><input type="hidden" name="lat" value="'+y2lat(y)+'"></div>';
	var description = '<div><span class="InputLabel">'+_('Description:')+'</span><input type="text" id="description" name="text"></div>';
	var nickname = '<div><span class="InputLabel">'+_('Your Nickname:')+'</span><input type="text" id="nickname" value="'+(nickname ? nickname : 'NoName')+'"></div>';
	var form_footer = '<div class="FormFooter"><input type="button" value="'+_('OK')+'" onclick="add_bug_submit(this.form);"><input type="button" value="'+_('Cancel')+'" onclick="add_bug_cancel();"></div></form>';

	return intro_text+form_header+description+nickname+form_footer;
}

/* Html markup which is shown in the popup when a new bug is being submitted.
 */
function popup_add_bug_wait()
{
	return '<h1>'+_('Create an Error Report')+'</h1><p>'+_('Please wait while your error is submitted ...')+'</p>';
}

/* Html markup for popups with an add comment form.
 */
function popup_add_comment(bug_or_id, nickname)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	var description = '<h1>'+_('Add a Comment')+'</h1><p><b>'+_('Description:')+'</b> '+fix_markup(bug.text)+'</p>';
	var form_header = '<form class="NewComment"><div><input type="hidden" name="id" value="'+bug.id+'"></div>';
	var comment = '<div><span class="InputLabel">'+_('Your Comment:')+'</span><input type="text" id="comment" name="text"></div>';
	var nickname = '<div><span class="InputLabel">'+_('Your Nickname:')+'</span><input type="text" id="nickname" value="'+(nickname ? nickname : 'NoName')+'"></div>';
	var form_footer = '<div class="FormFooter"><input type="button" value="'+_('OK')+'" onclick="add_comment_submit('+bug.id+', this.form);"><input type="button" value="'+_('Cancel')+'" onclick="reset_popup('+bug.id+');"></div></form>';
	
	return description+form_header+comment+nickname+form_footer;
}

/* Html markup for popups with a "mark as fixed" confirmation dialogue.
 */
function popup_close_bug(bug_or_id, nickname)
{
	bug = bug_or_id instanceof Object ? bug_or_id : get_bug(bug_or_id);

	var warning = '<h1>'+_('Mark Error as Fixed')+'</h1><p>'+_('Do you really want to mark this error as fixed? The error will be deleted after a week.')+'</p>';
	var form_header = '<form><div><input type="hidden" name="id" value="'+bug.id+'"></div>';
	var comment = '<div><span class="InputLabel">'+_('Your Comment:')+'</span><input type="text" id="comment" name="text"></div>';
	var nickname = '<div><span class="InputLabel">'+_('Your Nickname:')+'</span><input type="text" id="nickname" value="'+(nickname ? nickname : 'NoName')+'"></div>';
	var form_footer = '<div class="FormFooter"><input type="button" value="'+_('Yes')+'" onclick="close_bug_submit('+bug.id+', this.form);"><input type="button" value="'+_('No')+'" onclick="reset_popup('+bug.id+');"></div></form>';
	var description = '<p><b>'+_('Description:')+'</b> '+fix_markup(bug.text)+'</p>';

	return warning+form_header+comment+nickname+form_footer+description;
}


/*
 * Openstreetbugs main functions
 */

/* base url for images used by openstreetbugs:
 */
var osb_img_path = "/client/";

/* Map object to which openstreetbugs has been added: 
 */
var osb_map = null;

/* The path on the server which contains the openstreetbugs
 * server side scripts:
 */
var osb_server_path = null;

/* Feature layer for openstreetbugs:
 */
var osb_layer = null;

/* List of downloaded bugs: 
 */
var osb_bugs = new Array();

/* Current state of the user interface. This is used
 * to keep track which popups are displayed. */
var osb_state = 0;
var osb_current_feature = null;

/* cursor display over the map */
/* disabled --> default cursor, active --> crosshair */
var map_cursor = "default"

/* Call this method to activate openstreetbugs on the map.
 * The argument map must refer to an Openlayers.Map object. The
 * second argument defines the path on the server which contains 
 * the openstreetbugs server side scripts.
 */
function init_openstreetbugs(map, server_path)
{
	osb_map = map;
	osb_server_path = server_path;
	if (osb_server_path.charAt(osb_server_path.length-1) != "/")
		osb_server_path += "/";

	document.getElementById("map").style.cursor = map_cursor;

	osb_layer = new OpenLayers.Layer.Markers("OpenStreetBugs");
	osb_layer.setOpacity(0.7);

	osb_map.addLayer(osb_layer);

	osb_map.events.register('moveend', osb_map, refresh_osb);

	var click = new OpenLayers.Control.Click();
	osb_map.addControl(click);
	click.activate();

	refresh_osb();
	translate_sidebar();
}


/*
 * AJAX functions
 */

/* Request bugs from the server.
 */
function make_request(url, params)
{
	url = osb_server_path+url;
	for (var name in params)
	{
		url += (url.indexOf("?") > -1) ? "&" : "?";
		url += encodeURIComponent(name) + "=" + encodeURIComponent(params[name]);
	}

	var script = document.createElement("script");
	script.src = url;
	script.type = "text/javascript";
	document.body.appendChild(script);
}

/* This function is called from the scripts that are returned 
 * on make_request calls.
 */
function putAJAXMarker(id, lon, lat, text, type)
{
	if (!bug_exist(id))
	{
		var bug = {id: id, text: text, lat: lat, lon: lon, type: type, feature: null};

		if (bug.type == 0)
			bug.feature = create_feature(lon2x(lon), lat2y(lat), popup_open_bug(bug), type);
		else
			bug.feature = create_feature(lon2x(lon), lat2y(lat), popup_closed_bug(bug), type);
 		
		osb_bugs.push(bug);
	}
}

function get_form_values(fobj)
{
	var str = "";
	var valueArr = null;
	var val = "";
	var cmd = "";
	for (var i = 0;i < fobj.elements.length;i++)
	{
		switch (fobj.elements[i].type)
		{
			case "text":
			case "textarea":
			case "hidden":
				str += fobj.elements[i].name + "=" + encodeURIComponent(fobj.elements[i].value) + "&";
				break;
			case "select-one":
				str += fobj.elements[i].name + "=" + fobj.elements[i].options[fobj.elements[i].selectedIndex].value + "&";
				break;
		}
	}
	str = str.substr(0,(str.length - 1));
	return str;
}

function submit_form(f, url, on_submitted, on_finished)
{
	url = osb_server_path+url;
	var str = get_form_values(f);
	if(on_submitted)
		on_submitted();
	get_xml(url, str, on_finished);
}

function get_xml(url, str, on_finished)
{
	var xhr;
	try  { xhr = new ActiveXObject('Msxml2.XMLHTTP'); }
	catch (e)
	{
		try  { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
		catch (e2)
		{
			try  { xhr = new XMLHttpRequest(); }
			catch (e3)  { xhr = false; }
		}
	}

	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4)
		{
			if (on_finished)
				on_finished(xhr.status);
		}
	};

	xhr.open( 'POST', url, true );
	xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
	xhr.send(str);
}

/*
 * Bug management
 */

/* Downloads new bugs from the server.
 */
function refresh_osb()
{
	if (refresh_osb.call_count == undefined)
		refresh_osb.call_count = 0;
	else
		++refresh_osb.call_count;
	
	bounds = osb_map.getExtent().toArray();
	b = shorter_coord(y2lat(bounds[1]));
	t = shorter_coord(y2lat(bounds[3]));
	l = shorter_coord(x2lon(bounds[0]));
	r = shorter_coord(x2lon(bounds[2]));

	refresh_sidebar();

	var params = { "b": b, "t": t, "l": l, "r": r, "ucid": refresh_osb.call_count };
	make_request("getBugs", params);
}

/* shorten coordinate to 5 digits in decimal fraction */
function shorter_coord(coord)
{
	return Math.round(coord*100000)/100000;
}

function refresh_sidebar()
{
	var params = permalink.createParams();
	var zoom = params.zoom;
	var lon = params.lon;
	var lat = params.lat;
	var layers = params.layers;

	if (zoom > 10) {
		document.getElementById("rsslink").style.display = "list-item";
		document.getElementById("rsslink").innerHTML = "<a href='"+osb_server_path+"getRSSfeed?b="+b+"&t="+t+"&l="+l+"&r="+r+"'>"+_("RSS feed")+"</a>";
		document.getElementById("gpxlink").style.display = "list-item";
		document.getElementById("gpxlink").innerHTML = "<a href='"+osb_server_path+"getGPX?b="+b+"&t="+t+"&l="+l+"&r="+r+"'>"+_("GPX export")+"</a>";
		document.getElementById("gpxlink2").style.display = "list-item";
		document.getElementById("gpxlink2").innerHTML = "<a href='"+osb_server_path+"getGPX?b="+b+"&t="+t+"&l="+l+"&r="+r+"&open=yes'>"+_("GPX export")+"</a>"+_(" (open bugs)");
	} else {
		document.getElementById("gpxlink").style.display = "none";
		document.getElementById("gpxlink2").style.display = "none";
		document.getElementById("rsslink").style.display = "none";
	}
	document.getElementById("permalink").innerHTML = "<a href='?lon="+lon+"&lat="+lat+"&zoom="+zoom+"&layers="+layers+"'>"+_("Permalink")+"</a>";
	document.getElementById("geofabrik").innerHTML = "<a href='http://tools.geofabrik.de/map/?lon="+lon+"&lat="+lat+"&zoom="+zoom+"'>"+_("Geofabrik Map")+"</a>";
	document.getElementById("osmdotorg").innerHTML = "<a href='http://www.openstreetmap.org/?lon="+lon+"&lat="+lat+"&zoom="+zoom+"'>"+_("OpenStreetMap.org")+"</a>";
}

/* Check if a bug has been downloaded already.
 */
function bug_exist(id)
{
	for (var i in osb_bugs)
	{
		if (osb_bugs[i].id == id) 
			return true;
	}
	return false;
}

/* Return a bug description from the list of downloaded bugs.
 */
function get_bug(id)
{
	for (var i in osb_bugs)
	{
	    if (osb_bugs[i].id == id)
			return osb_bugs[i];
	}
	return '';
}

/* This function creates a feature and adds a corresponding
 * marker to the map.
 */
function create_feature(x, y, popup_content, type)
{
	if(!create_feature.open_bug_icon)
	{
		icon_size = new OpenLayers.Size(22, 22);
		icon_offset = new OpenLayers.Pixel(-icon_size.w/2, -icon_size.h/2);
		create_feature.open_bug_icon = new OpenLayers.Icon(osb_img_path+'open_bug_marker.png', icon_size, icon_offset);
		create_feature.closed_bug_icon = new OpenLayers.Icon(osb_img_path+'closed_bug_marker.png', icon_size, icon_offset);
	}

	var icon = !type ? create_feature.open_bug_icon.clone() : create_feature.closed_bug_icon.clone();
	var feature = new OpenLayers.Feature(osb_layer, new OpenLayers.LonLat(x, y), {icon: icon});
	// TODO closeBox should be true, but not closing bugs by clicking the marker leads to buggy behaviour
	feature.closeBox = false;
	feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud);
	feature.data.popupContentHTML = popup_content;

	create_marker(feature);

	return feature;
}

function create_marker(feature)
{
	var marker = feature.createMarker();
	var marker_click = function (ev)
	{
		if (osb_state == 0)
		{
			this.createPopup(this.closeBox);
			osb_map.addPopup(this.popup);
			osb_state = 1;
			osb_current_feature = this;
		}
		else if (osb_state == 1 && osb_current_feature == this)
		{
			osb_map.removePopup(this.popup)
			osb_state = 0;
			osb_current_feature = null;
		}
		OpenLayers.Event.stop(ev);
	};
	var marker_mouseover = function (ev)
	{
		if (osb_state == 0)
		{
			document.getElementById("map").style.cursor = "pointer";
			this.createPopup(this.closeBox);
			osb_map.addPopup(this.popup)
		}
		else if (osb_state != 2 && this == osb_current_feature) /* If not adding a new bug show pointer over current feature */
			document.getElementById("map").style.cursor = "pointer";

		OpenLayers.Event.stop(ev);
	};
	var marker_mouseout = function (ev)
	{
		if (osb_state == 0)
		{
			document.getElementById("map").style.cursor = map_cursor;
			osb_map.removePopup(this.popup);
		}
		else
			document.getElementById("map").style.cursor = "default";
		OpenLayers.Event.stop(ev);
	};
	/* marker_click must be registered as click and not as mousedown!
	 * Otherwise a click event will be propagated to the click control
	 * of the map under certain conditions.
	 */
	marker.events.register("click", feature, marker_click);
	marker.events.register("mouseover", feature, marker_mouseover);
	marker.events.register("mouseout", feature, marker_mouseout);

	osb_layer.addMarker(marker);
}


/*
 * Control to handle clicks on the map
 */

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {

	initialize: function() {
		OpenLayers.Control.prototype.initialize.apply(this, arguments);
	},

	destroy: function() {
		if (this.handler)
			this.handler.destroy();
		this.handler = null;

		OpenLayers.Control.prototype.destroy.apply(this, arguments);
	},

	draw: function() {
		handlerOptions = {
		'single': true,
		'double': false,
		'pixelTolerance': 0,
		'stopSingle': false,
		'stopDouble': false
		};

		this.handler = new OpenLayers.Handler.Click(this, {'click': this.click}, handlerOptions);
	},

	click: function(ev) {
		var lonlat = osb_map.getLonLatFromViewPortPx(ev.xy);
		/* disabled adding new bugs */
		/*add_bug(lonlat.lon, lonlat.lat);*/
	},

	CLASS_NAME: "OpenLayers.Control.Click"
});


/*
 * Actions
 */

function add_bug(x, y)
{
	if(osb_state == 0)
	{
		document.getElementById("map").style.cursor = "default";

		osb_state = 2;
		osb_current_feature = create_feature(x, y, popup_add_bug(x, y, get_cookie("osb_nickname")), 0);

		osb_current_feature.createPopup(osb_current_feature.closeBox);
		osb_map.addPopup(osb_current_feature.popup);

		document.getElementById('description').focus();
	}
}

function add_bug_submit(form)
{
	set_cookie("osb_nickname", document.getElementById("nickname").value);
	description = document.getElementById("description");
	description.value += " ["+ document.getElementById("nickname").value + "]";

	submit_form(form, "addPOIexec", add_bug_submitted, add_bug_completed);
}

function add_bug_submitted()
{
	osb_current_feature.popup.setContentHTML(popup_add_bug_wait());
}

function add_bug_completed()
{
	document.getElementById("map").style.cursor = map_cursor;

	osb_layer.removeMarker(osb_current_feature.marker);
	osb_map.removePopup(osb_current_feature.popup);
	osb_current_feature.destroy();
	osb_current_feature = null;
	osb_state = 0;
	refresh_osb();
}

function add_bug_cancel()
{
	document.getElementById("map").style.cursor = map_cursor;

	osb_layer.removeMarker(osb_current_feature.marker);
	osb_map.removePopup(osb_current_feature.popup);
	osb_current_feature.destroy();
	osb_state = 0;
	osb_current_feature = null;
}

function add_comment(id)
{
	osb_state = 3;
	osb_current_feature.popup.setContentHTML(popup_add_comment(id, get_cookie("osb_nickname")));
	document.getElementById("comment").focus();
}

function add_comment_submit(id, form)
{
	set_cookie("osb_nickname", document.getElementById("nickname").value);
	comment = document.getElementById("comment");
	comment.value += " ["+ document.getElementById("nickname").value +"]";
	
	submit_form(form, "editPOIexec");

	var str = escape_html(form.text.value);
	for (var i in  osb_bugs)
	{
		if (osb_bugs[i].id == id)
		{
			str = osb_bugs[i].text + "<hr />" + str;
			osb_bugs[i].text = str;
			break;
		}
	}

	reset_popup(id);
}

function close_bug(id)
{
	osb_state = 4;
	osb_current_feature.popup.setContentHTML(popup_close_bug(id, get_cookie("osb_nickname")));
}

function close_bug_submit(id, form)
{
  add_comment_submit(id,form);
	submit_form(form, "closePOIexec");
	
	for (var i in  osb_bugs)
	{
		if (osb_bugs[i].id == id)
		{
			// Change bug status to closed:
			osb_bugs[i].type = 1;
			osb_bugs[i].feature.data.icon = create_feature.closed_bug_icon.clone();
			osb_layer.removeMarker(osb_bugs[i].feature.marker);
			osb_bugs[i].feature.destroyMarker();

			create_marker(osb_bugs[i].feature);
			break;
		}
	}

	reset_popup(id);
}

function reset_popup(id)
{
	document.getElementById("map").style.cursor = "default";

	var bug = get_bug(id);
	if (bug.type == 0)
		bug.feature.popup.setContentHTML(popup_open_bug(id));
	else
		bug.feature.popup.setContentHTML(popup_closed_bug(id));
	
	osb_state = 1;
}

function clear_overlays()
{
	/* remove and destroy all markers */
	var marker;
	while( osb_layer.markers.length ) {
		marker = osb_layer.markers[0];
		osb_layer.removeMarker(osb_layer.markers[0]);
		marker.destroy();
		/*marker = null;*/
	}
	osb_bugs = []; /* markers not present anymore */

	/* remove and destroy all popups */
	var popup;
	while( osb_map.popups.length ) {
		popup = osb_map.popups[0];
		osb_map.removePopup(osb_map.popups[0]);
		popup.destroy();
		/*popup = null;*/
	}
}
