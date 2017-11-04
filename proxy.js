var proxyListener = require('./lib/proxy_listener');
var simplemultialgo = require('./config.json').result.simplemultialgo;

global.pools = new Map();
var listeners = new Map();

simplemultialgo.forEach(function(element) {
    element.host = element.name + ".hk.nicehash.com";
    global.pools.set(element.port,element);
    var listener = proxyListener.createMiningListener();
    listener.listen(element.port);
    listeners.set(element.name,listener);
}, this);