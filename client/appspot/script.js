function plusfacteur(a) { return a * (20037508.34 / 180); }
function moinsfacteur(a) { return a / (20037508.34 / 180); }
function y2lat(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(moinsfacteur(a)*Math.PI/180)) - Math.PI/2); }
function lat2y(a) { return plusfacteur(180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2))); }
function x2lon(a) { return moinsfacteur(a); }
function lon2x(a) { return plusfacteur(a); }
function lonLatToMercator(ll) {
  return new OpenLayers.LonLat(lon2x(ll.lon), lat2y(ll.lat));
}

function encodeMyHtml(str) {
  if(typeof(str)!="string"){ str=str.toString(); }
  str=str.replace(/&/g, "&amp;") ;
  str=str.replace(/"/g, "&quot;") ;
  str=str.replace(/</g, "&lt;") ;
  str=str.replace(/>/g, "&gt;") ;
  str=str.replace(/'/g, "&#146;") ;
  return str;
}

//----------- AJAX Tools --------------

//--- Remote Javascript ---
function makeRequest(sUrl, oParams) {
  for (sName in oParams) {
    if (sUrl.indexOf("?") > -1) {
      sUrl += "&";
    } else {
      sUrl += "?";
    }
    sUrl += encodeURIComponent(sName) + "=" + encodeURIComponent(oParams[sName]);
  }

  var oScript = document.createElement("script");
  oScript.src = sUrl;
  document.body.appendChild(oScript);
}

//--- Post Form ---
function getFormValues(fobj) {
  var str = "";
  var valueArr = null;
  var val = "";
  var cmd = "";
  for(var i = 0;i < fobj.elements.length;i++) {
    switch(fobj.elements[i].type)  {
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
var xmlReq = null;;
function submitForm(f, url) {
  var str = getFormValues(f);
  getXML(url,str);
}
function displayState() {}
function getXML(url,str) {
  var doc = null
  var xhr;
  try {  xhr = new ActiveXObject('Msxml2.XMLHTTP'); }
  catch (e) {
    try { xhr = new ActiveXObject('Microsoft.XMLHTTP'); }
    catch (e2) {
      try { xhr = new XMLHttpRequest(); }
      catch (e3) { xhr = false; }
    }
  }
  xhr.onreadystatechange = function() {
    if(xhr.readyState == 4) {
      if(xhr.status == 200) {
        //ok
      } else {
        //error
      }
    }
  };

  xhr.open( 'POST', url, true );
  xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
  xhr.send(str);
}

//==================================================================
//------------------------ Markers management ----------------------

function refreshPOIs() {
  bounds = map.getExtent().toArray();
  var b = y2lat(bounds[1]);
  var t = y2lat(bounds[3]);
  var l = x2lon(bounds[0]);
  var r = x2lon(bounds[2])
  var oParams = { "b": b, "t": t, "l": l, "r": r };
  makeRequest("/api/0.1/getBugs", oParams);
  coords = map.getCenter();
  var lon = x2lon(coords.lon);
  var lat = y2lat(coords.lat);
  var zoom = map.getZoom();
  if (zoom > 10) {
    document.getElementById("gpxlink").innerHTML = "<a href='api/0.1/getGPX?b="+b+"&t="+t+"&l="+l+"&r="+r+"'>As GPX file</a>";
    document.getElementById("rsslink").innerHTML = "<a href='api/0.1/getRSSfeed?b="+b+"&t="+t+"&l="+l+"&r="+r+"'>As RSS feed</a>";
  } else {
    document.getElementById("gpxlink").innerHTML = "&nbsp;";
    document.getElementById("rsslink").innerHTML = "&nbsp;";
  }
  document.getElementById("permalink").innerHTML = "<a href='?lon="+lon+"&lat="+lat+"&zoom="+zoom+"'>Permalink</a>";
}
function endDrag(event) {
  refreshPOIs();
}

var markers = new Array();
function markerExist(id) {
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) return true;
  }
  return false;
}
// getMarker(id)[j] -> 1:text / 2:lat / 3:lon / 4:markertype
function getMarker(id) {
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) return markers[i];
  }
  return '';
}
function getMarkerText(id) {
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) return markers[i][1];
  }
  return '';
}
function getMarkerlat(id) {
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) return markers[i][2];
  }
  return '';
}
function getMarkerlon(id) {
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) return markers[i][3];
  }
  return '';
}

function putAJAXMarker(id, lon, lat, markerText, marktype) {
  if (!markerExist(id)) {
    markers.push(new Array(id, markerText, lat, lon, marktype));
    if (marktype == 0) {
      putMarker(lon2x(lon), lat2y(lat), "<div>"+markerText+"</div><div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a><br/><a href='http://www.openstreetmap.org/edit?lat="+lat+"&lon="+lon+"&zoom=17' target='_blank'>Edit in Potlatch</a><br/><a href='#' onclick='delMarker("+id+"); return false;'>Close mark</a></div>", marktype);
    } else {
      putMarker(lon2x(lon), lat2y(lat), "<div>"+markerText+"</div><!--<div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a></div>-->", marktype);
    }
  }
}

var currentPopup;
var currentFeature;
var clicked = false;
function showPop (feature) {
    if (currentPopup != null) {
      currentPopup.hide();
    }
    if (feature.popup == null) {
        feature.popup = feature.createPopup();
        map.addPopup(feature.popup);
    } else {
        feature.popup.toggle();
    }
    currentPopup = feature.popup;
}
var size = new OpenLayers.Size(22,22);
var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
var icon_error = new OpenLayers.Icon('client/open_bug_marker.png',size,offset);
var icon_valid = new OpenLayers.Icon('client/closed_bug_marker.png',size,offset);
function putMarker(x, y, popupContent, marktype) {
  var iconclone;
  if (marktype == 0) {
    iconclone = icon_error.clone();
  } else if (marktype == 1) {
    iconclone = icon_valid.clone();
  } else {
    iconclone = icon_error.clone();
  }
  var feature = new OpenLayers.Feature(markers, new OpenLayers.LonLat(x, y), {icon:iconclone});
  feature.closeBox = false;
  feature.popupClass = OpenLayers.Class(OpenLayers.Popup.FramedCloud);
  feature.data.popupContentHTML = popupContent;
  feature.data.overflow = "hidden";
  var marker = feature.createMarker();
  var markerClick = function (evt) {
    currentFeature = this;
    if (clicked) {
      if (currentPopup == this.popup) {
        this.popup.hide();
        clicked = false;
      } else {
        currentPopup.hide();
        showPop(this);
      }
    } else {
      showPop(this);
      clicked = true;
    }
    OpenLayers.Event.stop(evt);
  };
  var markerOver = function (evt) {
    document.body.style.cursor='pointer';
    if (!clicked) showPop(this);
    OpenLayers.Event.stop(evt);
  };
  var markerOut = function (evt) {
    document.body.style.cursor='auto';
    if (!clicked && currentPopup != null) currentPopup.hide();
    OpenLayers.Event.stop(evt);
  };
  marker.events.register("mousedown", feature, markerClick);
  marker.events.register("mouseover", feature, markerOver);
  marker.events.register("mouseout", feature, markerOut);

  layerMarkers.addMarker(marker);
  return feature;
}
function resetMarker(id) {
  var mark = getMarker(id);
  var mark_text = mark[1];
  var mark_lat = mark[2];
  var mark_lon = mark[3];
  var mark_type = mark[4];
  if (mark_type == 0) {
    currentPopup.setContentHTML("<div>"+mark_text+"</div><div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a><br /><a href='http://www.openstreetmap.org/edit?lat="+mark_lat+"&lon="+mark_lon+"&zoom=17' target='_blank'>Edit in Potlatch</a><br /><a href='#' onclick='delMarker("+id+"); return false;'>Close mark</a></div>");
  } else {
    currentPopup.setContentHTML("<div>"+mark_text+"</div><!--<div><br/><a href='#' onclick='editPopup("+id+"); return false;'>Add comment</a></div>-->");
  }
}



//--------------- add mark ------------
var tempFeature;
function putNewMarker(x, y) {
  tempFeature = putMarker(x, y, "<form><input type='hidden' name='lon' value='"+x2lon(x)+"' /><input type='hidden' name='lat' value='"+y2lat(y)+"' /><input type='text' id='addTextBox"+x+":"+y+"' name='text' onKeyPress='addMarkerCheckEnter(event, this.form);' /><br/><input type='button' value='ok' onclick='addMarkerSubmit(this.form);' /><input type='button' value='cancel' onclick='cancelAddMarker();' /></form>", 0);
  clicked = true;
  showPop(tempFeature);
  document.getElementById('addTextBox'+x+':'+y).focus();
}
var addingMarker = false;
function addMarker() {
  addingMarker = !addingMarker;
  if (addingMarker) {
    document.body.style.cursor='crosshair';
  } else {
    document.body.style.cursor='auto';
  }
}
function addMarkerCheckEnter(ev, form) {
  ev=ev||event;
  if (ev) {
    if(ev.keyCode==13) {
      addMarkerSubmit(form);
      return false;
    }
  }
  return true;
}
function addMarkerSubmit(form) {
  form.text.value = form.text.value + " ["+ document.getElementById('nickname').value + "]";
  submitForm(form, "api/0.1/addPOIexec");
  layerMarkers.removeMarker(tempFeature.marker);
  tempFeature.popup.destroy();
  tempFeature.marker.destroy();
  tempFeature = null;
  currentPopup = null;
  clicked = false;
  setTimeout("refreshPOIs()", 2000);
}
function cancelAddMarker() {
  layerMarkers.removeMarker(tempFeature.marker);
  tempFeature.popup.destroy();
  tempFeature.marker.destroy();
  tempFeature = null;
  currentPopup = null;
  clicked = false;
}

//------------ add comment ------------
function editPopup(id) {
  currentPopup.setContentHTML("<div>"+getMarkerText(id)+"</div><form id='edit'><input type='hidden' name='id' value='"+id+"' /><input type='text' id='editBox"+id+"' name='text' onKeyPress='editPopupCheckEnter(event, "+id+", this.form);'/><br /><input type='button' value='ok' onclick='editPopupSubmit("+id+", this.form);' /><input type='button' value='cancel' onclick='editPopupCancel("+id+");' /></form>");
  document.getElementById('editBox'+id).focus();
}
function editPopupCheckEnter(ev, id, form) {
  ev=ev||event;
  if (ev) {
    if(ev.keyCode==13) {
      editPopupSubmit(id, form);
      return false;
    }
  }
  return true;
}
function editPopupSubmit(id, form) {
  form.text.value = form.text.value + " ["+ document.getElementById('nickname').value +"]";
  submitForm(form, "api/0.1/editPOIexec");
  var str = encodeMyHtml(form.text.value);
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) {
      str = markers[i][1] + "<hr />" + str;
      markers[i][1] = str;
      break;
    }
  }
  resetMarker(id);
}
function editPopupCancel(id) {
  resetMarker(id);
}

//----------- close mark -----------
function delMarker(id) {
  currentPopup.setContentHTML("<div>"+getMarkerText(id)+"</div><br/><div class='alert'>Do you really want to close this marker ?<br/>The marker will be deleted after a week.</div><form><input type='hidden' name='id' value='"+id+"' /><input type='button' value='yes' onclick='delMarkerSubmit("+id+", this.form);' /><input type='button' value='cancel' onclick='delMarkerCancel("+id+");' /></form>");
}
function delMarkerSubmit(id, form) {
  submitForm(form, "api/0.1/closePOIexec");
  layerMarkers.removeMarker(currentFeature.marker);
  currentFeature.popup.destroy();
  currentFeature.marker.destroy();
  currentFeature = null;
  currentPopup = null;
  clicked = false;
  for ( var i = 0; i < markers.length; i++ ) {
    if ( markers[i][0] == id ) {
      markers[i][0] = -1;
      break;
    }
  }
  setTimeout("refreshPOIs()", 2000);
}
function delMarkerCancel(id) {
  resetMarker(id);
}

/* ------------ curseur et clic sur carte -------------- */

function mapOver() {
  if (addingMarker) document.body.style.cursor='crosshair';
}
function mapOut() {
  document.body.style.cursor='auto';
}
OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
  defaultHandlerOptions: {
      'single': true,
      'double': false,
      'pixelTolerance': 0,
      'stopSingle': false,
      'stopDouble': false
  },
  initialize: function(options) {
      this.handlerOptions = OpenLayers.Util.extend(
          {}, this.defaultHandlerOptions
      );
      OpenLayers.Control.prototype.initialize.apply(
          this, arguments
      );
      this.handler = new OpenLayers.Handler.Click(
          this, {
              'click': this.trigger
          }, this.handlerOptions
      );
  },
  trigger: function(e) {
    if (addingMarker) {
      var lonlat = map.getLonLatFromViewPortPx(e.xy);
      addingMarker = false;
      document.body.style.cursor='auto';
      putNewMarker(lonlat.lon, lonlat.lat);
    }
  }
});


/*----------------------------------- cookie for nickname ------------------------- */

function loadNickname() {
  var nickname = "";
  var nameEQ = "name=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) {
      nickname = c.substring(nameEQ.length,c.length);
      break;
    }
  }
  if (nickname == "") {nickname = "NoName";}
  document.getElementById('nickname').value = nickname;
}
function saveNickname() {
  var nickname = document.getElementById('nickname').value;
  var expires = (new Date((new Date()).getTime() + 157680000000)).toGMTString();
  document.cookie="name="+encodeURIComponent(nickname)+";expires="+expires+";path=/";
}
