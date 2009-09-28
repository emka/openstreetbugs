function _ (msgid) {
    if (translation[msgid])
	    return translation[msgid];
    else
	    return msgid;
}

var userLang = (navigator.language) ? navigator.language : navigator.userLanguage;

function set_language (lang) {
    var script = document.createElement('script');
    script.src = 'locale/osb.'+lang+'.json';
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.onload = function() {
        translate_sidebar();
        clear_overlays();
        refresh_osb();
    }
    document.body.appendChild(script);
}

function translate_sidebar () {
    var introduction = _('Feel free to put the modifications you would like to see on {{OpenStreetMap}} on the map.');
    introduction = introduction.replace('{{OpenStreetMap}}','<a href="http://www.openstreetmap.org">OpenStreetMap</a>');
    var license = _('According to the OpenStreetMap license, the data that you add on the map will be licensed {{License}}.');
    license = license.replace('{{License}}','<a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA</a>');
    document.getElementById('introduction').innerHTML = '<p>'+introduction+'</p><p><span class="warn">'+_('Do NOT use licensed data')+'</span>'+_(' like paper maps, Google Maps, etc. Use only your knowledge of the reality or public domain data.')+'</p><p>'+license+'</p><p>'+_('To add a bug, click at the desired spot in the map.')+'</p><p><a href="more.html">'+_('More information')+'</a></p>';
    document.getElementById('linkbox-header').innerHTML = _('current view');

    document.title = 'OpenStreetBugs - '+_('Help us to improve OpenStreetMap');
}

var translation = {};
