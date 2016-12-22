'use strict';

Array.prototype.indexOf = Array.prototype.indexOf || function(arr,item){
    for (var i = 0,len = arr.length; i < len; i++) {
        if (arr[i] === item){
            return i;
        }
    }
    return -1;
}

var objectRegExp = /^\[object (\S+)\]$/,
    toString     = Object.prototype.toString,
    slice        = Array.prototype.slice,
    noop         = function(){},
    handlers     = {},
    assets       = {},
    PRELOADING   = 1,
    PRELOADED    = 2,
    LOADING      = 3,
    LOADED       = 4,
    isDomReady;

var isCss      = new RegExp('\\.css'),
    isAsync    = "async" in doc.createElement("script") || "MozAppearance" in doc.documentElement.style || global.opera,
    body       = doc.getElementsByTagName('body')[0];

function getType(obj){
    var type = typeof obj;
    if (type !== 'object') {
        return type;
    }
    return toString.call(obj)
        .replace(objectRegExp, '$1').toLowerCase();
}

function each(arr,callback,context){
    context = context || null;
    if(!arr){
        return;
    }
    if(typeof arr === "object"){
        arr = [].slice.call(arr);
    }
    for(var i = 0, l = arr.length; i < l; i++){
        callback.call(context,arr[i],i);
    }
}

function one(callback){
    callback = callback || noop;
    if(callback._done){
        return;
    }
    callback();
    callback._done = 1;
}

function toLabel(url) {
    var items = url.split("/"),
         name = items[items.length - 1],
         i    = name.indexOf("?");
    return i !== -1 ? name.substring(0, i) : name;
}

var Loader = function(uarray,async,cb){
    if(!(this instanceof Loader)){
        return new Loader(uarray,async,cb);
    }
    var args = arguments;
    if(!args[1] || typeof args[1] === 'function'){
        args[1] = false;
        args[2] = function(){};
    }
    args[0] = getType(args[0]) === 'array' ? args[0] : [args[0]];
    args[2] = args[2] || function(){};
    this.init.apply(this,args);
}

Loader.prototype.init = function(urls,async,fn){
    if(!urls.length){
        return fn();
    }
    this.ready(function(){
        this[isAsync ? "loadAsync" : "loadHack"](urls,fn)
    })
}

Loader.prototype.preLoad = function(asset,callback){
    if (asset.state === undefined) {
        asset.state     = PRELOADING;
        asset.onpreload = [];
        this.loadAsset({ url: asset.url, type: "cache" },function(){
            this.onPreload(asset);
        });
    }
}

Loader.prototype.allLoaded = function(items) {
    items = items || assets;
    for(var name in items){
        if(items.hasOwnProperty(name) && items[name].state !== LOADED){
            return false;
        }
    }
    return true;
}

Loader.prototype.onPreload = function(asset){
    asset.state = PRELOADED;
    each(asset.onpreload,function(afterPreload){
        afterPreload.call(this);
    },this);
}

Loader.prototype.getAsset = function(item){
    var asset = {};
    if(typeof item === "object"){
        for(var label in item){
            if(!!item[label]){
                asset = {
                    name: label,
                    url : item[label]
                };
            }
        }
    }else {
        asset = {
            name: toLabel(item),
            url : item
        };
    }

    var existing = assets[asset.name];
    if (existing && existing.url === asset.url) {
        return existing;
    }
    assets[asset.name] = asset;
    return asset;
}

Loader.prototype.loadHack = function loadHack(){
    var args     = arguments,
        callback = args[args.length - 1],
        rest     = [].slice.call(args,1),
        next     = rest[0];

    if(!(getType(callback) === 'function')){
        callback = null;
    }

    if(getType(args[0]) === 'array'){
        args[0].push(callback);
        loadHack.apply(this,args[0]);
        return;
    }

    if(!!next){
        each(rest,function(item){
            if((!getType(item) === 'function') && !!item){
                this.preLoad(this.getAsset(item));
            }
        },this);
        this.load(this.getAsset(args[0]),getType(next) === 'function' ? next : function (){
            loadHack.apply(this,rest);
        });
    }
    else {
        this.load(this.getAsset(args[0]));
    }
}

Loader.prototype.loadAsync = function loadAsync(){
    var args     = arguments,
        callback = args[args.length - 1],
        items    = {};

    if(!(getType(callback) === 'function')){
        callback = null;
    }

    if(getType(args[0]) === 'array'){
        args[0].push(callback);
        loadAsync.apply(this,args[0]);
        return;
    }

    each(args,function(item,i){
        if(item !== callback){
            items[item.name] = item;
            item             = this.getAsset(item);
        }
    },this);

    each(args,function(item,i){
        if (item !== callback){
            item = this.getAsset(item);
            this.load(item,function(){
                if(this.allLoaded(items)){
                    one(callback);
                }
            });
        }
    },this);
}

Loader.prototype.load = function(asset,callback){
    var _this = this;
    callback = callback || noop;
    
    if(asset.state === LOADED){
        callback.call(_this);
        return;
    }

    if(asset.state === PRELOADING){
        asset.onpreload.push(function(){
            this.load(asset,callback);
        });
        return;
    }

    asset.state = LOADING;

    this.loadAsset(asset,function(){
        asset.state = LOADED;
        callback.call(_this);
        each(handlers[asset.name],function(fn){
            one(fn);
        });
        if(isDomReady && this.allLoaded()){
            each(handlers.ALL,function(fn){
                one(fn);
            });
        }
    });
}

Loader.prototype.loadAsset = function(asset,callback){
    callback = callback || noop;
    var ele,
        _this = this;

    function error(event){
        event = event || global.event;
        ele.onload = ele.onreadystatechange = ele.onerror = null;
        callback.call(_this);
    }

    function process(event){
        event = event || global.event;
        if(event.type === "load" || (/loaded|complete/.test(ele.readyState) && (!doc.documentMode || doc.documentMode < 9))){
            global.clearTimeout(asset.errorTimeout);
            global.clearTimeout(asset.cssTimeout);
            ele.onload = ele.onreadystatechange = ele.onerror = null;
            callback.call(_this);
        }
    }

    function isCssLoaded() {
        if(asset.state !== LOADED && asset.cssRetries <= 20){
            for(var i = 0, l = doc.styleSheets.length; i < l; i++){
                if(doc.styleSheets[i].href === ele.href){
                    process({ "type": "load" });
                    return;
                }
            }
            asset.cssRetries++;
            asset.cssTimeout = global.setTimeout(isCssLoaded, 250);
        }
    }

    function loadCss(){
        ele      = doc.createElement("link");
        ele.type = "text/" + (asset.type || "css");
        ele.rel  = "stylesheet";
        ele.href = asset.url;
        asset.cssRetries = 0;
        asset.cssTimeout = global.setTimeout(isCssLoaded, 500);  
    }

    function loadJs(){
        ele      = doc.createElement("script");
        ele.type = "text/" + (asset.type || "javascript");
        ele.src  = asset.url;
    }

    isCss.test(asset.url) ? loadCss() : loadJs();

    ele.onload  = ele.onreadystatechange = process;
    ele.onerror = error;
    ele.async   = false;
    ele.defer   = false;

    asset.errorTimeout = global.setTimeout(function(){
        error({ type: "timeout" });
    },7e3);

    body.appendChild(ele);
}

Loader.prototype.ready = function(cb){
    var _this = this;
    function domReady(){
        if(!doc.body){
            global.clearTimeout(_this.readyTimeout);
            _this.readyTimeout = global.setTimeout(domReady,50);
            return;
        }

        if(!isDomReady){
            isDomReady = true;
            cb.call(_this);
        }
    }

    function domContentLoaded(){
        if(doc.addEventListener){
            doc.removeEventListener("DOMContentLoaded",domContentLoaded,false);
            domReady();
        }else if(doc.readyState === "complete"){
            doc.detachEvent("onreadystatechange",domContentLoaded);
            domReady();
        }
    }

    if (doc.readyState === "complete"){
        domReady();
    }else if(doc.addEventListener){
        doc.addEventListener("DOMContentLoaded",domContentLoaded,false);
        global.addEventListener("load",domReady,false);
    }else{
        doc.attachEvent("onreadystatechange",domContentLoaded);
        global.attachEvent("onload",domReady);
        var top = false;
        try{
            top = !global.frameElement && doc.documentElement;
        }catch(e){}

        if(top && top.doScroll){
            (function doScrollCheck(){
                if(!isDomReady){
                    try {
                        top.doScroll("left");
                    }catch (error){
                        global.clearTimeout(_this.readyTimeout);
                        _this.readyTimeout = global.setTimeout(doScrollCheck, 50);
                        return;
                    }
                    domReady();
                }
            }());
        }
    }
}