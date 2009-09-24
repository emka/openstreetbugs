function _ (msgid) {
    if (translation[msgid])
	    return translation[msgid];
    else
	    return msgid;
}

function set_language (lang) {
    var script = document.createElement('script');
    script.src = 'locale/'+lang+'.js';
    script.type = 'text/javascript';
    document.body.appendChild(script);
    
    clear_overlays();
    refresh_osb();

    document.getElementById('introduction').innerHTML = '<p>'+_('Feel free to put the modifications you would like to see on ')+'<a href="http://www.openstreetmap.org">OpenStreetMap</a>'+_(' on the map.')+'</p><p><span class="warn">'+_('Do NOT use licensed data')+'</span>'+_(' like paper maps, Google Maps, etc. Use only your knowledge of the reality or public domain data.')+'</p><p>'+_('According to the OpenStreetMap license, the data that you add on the map will be licensed ')+'<a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA</a>.</p><p>'+_('To add a bug, click at the desired spot in the map.')+'</p><p>'+_('Read and get ')+'<a href="more.html">'+_('more')+'</a>.</p>';
    document.getElementById('linkbox-header').innerHTML = _('current view');

}

var translation = {}
