/*
 * resourceLocal.js v0.0.1
 * date : 2016-12-13
 * author : linfang
 */
(function (global, factory) {
    if ( typeof require === 'function' && typeof module === 'object' && module && typeof exports === 'object' && exports ) {
        /* CommonJS */
        module.exports = factory();
    } else if ( typeof define === 'function' && define['amd'] ) {
        /* AMD */
        define(factory);
    } else {
        /* Global */
        global['Ljstore'] = global['Ljstore'] || factory(global);
    }
}(this, (function (global) {
    'use strict';

    var objectRegExp = /^\[object (\S+)\]$/,
        toString     = Object.prototype.toString,
        slice        = Array.prototype.slice,
        noop         = function(){},
        doc          = document,
        head         = doc.getElementsByTagName('head')[0],
        body         = doc.getElementsByTagName('body')[0],
        storage      = global.localStorage;

    function getType (obj) {
        var type = typeof obj;
        if (type !== 'object') {
            return type;
        }
        return toString.call(obj)
            .replace(objectRegExp, '$1').toLowerCase();
    }

    function isObject (obj) {
        return getType(obj) === 'object';
    }

    function isArray (arr) {
        return getType(arr) === 'array';
    }

    function isString (str) {
        return getType(str) === 'string';
    }

    function suffix (url) {
        var ext = url.match(/\.(\w+)(\?.+)?$/i);
        return ext ? ext[1] : ext;
    }

    function mix (source, target) {
        for ( var i in target ) {
            if ( target.hasOwnProperty(i) ) {
                source[i] = target[i];
            }
        }
    }

    function clone (obj) {
        var result = null;
        if ( isObject(obj) ) {
            result = {};
            for (var key in obj) {
                if ( isObject(obj[key]) || isArray(obj[key]) ) {
                    result[key] = clone(obj[key]);
                    continue
                }
                result[key] = obj[key];
            }
        } else if ( isArray(obj) ) {
            result = [];
            obj.forEach(function (item, index) {
                if ( isObject(item) || isArray(item) ) {
                    result[index] = clone(item);
                    return
                }
                result[index] = item;
            });
        } else {
            result = obj;
        }
        return result
    }

    function merge (target, source, force) {
        if ( force === void 0 ) {
            force = false;
        }

        if (!isObject(target) || !isObject(source)) { 
            return
        }
        var result = clone(target);
        for (var key in source) {
            if (!result.hasOwnProperty(key)) {
                result[key] = clone(source[key]);
            } else {
                result[key] = force ?
                clone(source[key]) :
                result[key];
            }
        }
        return result
    }

    function isUrl (url) {
        if (/<\/?[^>]*>/g.test(url) ) {
            return false;
        }

        var regex = '^' +
            '(((https|http|ftp|rtsp|mms):)+//)+' +
            '(([0-9a-z_!~*\'().&=+$%-]+: )?[0-9a-z_!~*\'().&=+$%-]+@)?' +
            '(([0-9]{1,3}.){3}[0-9]{1,3}|([0-9a-z_!~*\'()-]+.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].[a-z]{2,6})?' +
            '(:[0-9]{1,4})?' +
            '([^\?#]+)?' +
            '(\\\?[^#]+)?' +
            '(#.+)?' +
            '$';
        return new RegExp(regex).test(url);
    }

    function findIndex (arr, cb, context) {
        context = context || window;
        var value;
        for ( var i=0, len = arr.length; i < len; i++ ) {
            value = arr[i]
            if ( cb.call(context, value, i, arr) ) {
                return i
            }
        }
        return -1;
    }

    function uniqueArr (arr, key) {
        var obj = {},
            result = [];
        for (var i=0, len = arr.length; i < len; i++) {
            if ( !obj[arr[i][key]] ) {
                obj[arr[i][key]] = true;
                result.push(arr[i])
            }
        }
        return result;
    }

    function eachOf (arr, fn, callback, context) {
        callback = callback || function() {};
        arr = arr || [];
        context = context || null;
        if ( !arr.length ) {
            return callback();
        }

        var i = 0;
        arr.forEach(function (val, i) {
            fn.call(context,val, i, done);
        });

        function done(err){
            i++;
            if ( err ) {
                return callback.call(context,err);
            }
            if ( i === arr.length ) {
                callback.call(context);
            }
        }
    }

    function eachOfSeries (arr, fn, callback, context) {
      callback = callback || function() {};
      arr = arr || [];
      context = context || null;

      var i = -1;

      next();

      function next () {
        if (++i === arr.length) {
          return callback.call(context);
        }

        fn.call(context, arr[i], i, done);
      }

      function done (err) {
        if (err) {
          return callback.call(context, err);
        }
        next();
      }
    }

    function timeout (cb, time, context) {
        if ( !cb || typeof cb !== 'function') {
            return;
        }

        if ( !time ) {
            time = 5000
        }
        context = context || window;
        return function () {
            var _args = [].slice.call(arguments),
                _func = _args.shift();
            if ( !_func || typeof _func !== 'function' ) {
                return cb.call(context)
            }

            var _startTime = Date.now(),
                _timeid = setTimeout(function () {
                    _func("TIMEOUT");
                    _func = null;
                    clearTimeout(_timeid);
                    _timeid = null;
                }, time)
            
            _args.push(function () {
                clearTimeout(_timeid);
                _timeid = null;

                if ( !_func ) {
                    return ;
                }

                _func(null);
            })
            return cb.apply(context, _args)
        }
    }

    var JSONP = (function(){
        var head, 
            counter = 0, 
            config = {};
        function load (url, pfnError) {
            var script = doc.createElement('script'),
                done = false;
            script.src = url;
            script.async = true;
     
            var errorHandler = pfnError || config.error;
            if ( typeof errorHandler === 'function' ) {
                script.onerror = function (ex) {
                    errorHandler({url: url, event: ex});
                };
            }
            
            script.onload = script.onreadystatechange = function() {
                if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
                    done = true;
                    script.onload = script.onreadystatechange = null;
                    if ( script && script.parentNode ) {
                        script.parentNode.removeChild( script );
                    }
                }
            };
            
            if ( !head ) {
                head = doc.getElementsByTagName('head')[0];
            }
            head.appendChild( script );
        }
        function jsonp (url, params, callback, callbackName) {
            var query = (url||'').indexOf('?') === -1 ? '?' : '&', key;
                    
            callbackName = (callbackName||config['callbackName']||'callback');
            var uniqueName = callbackName + "_json" + (++counter);
            if ( typeof params === 'function' ) {
                callback = params;
                params = {};
            }
            params = params || {};
            for ( key in params ) {
                if ( params.hasOwnProperty(key) ) {
                    query += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
                }
            }   
            
            window[ uniqueName ] = function (data){
                callback(data);
                try {
                    delete window[ uniqueName ];
                } catch (e) {}
                window[ uniqueName ] = null;
            };
     
            load(url + query + callbackName + '=' + uniqueName);
            return uniqueName;
        }
        function setDefaults(obj){
            config = obj;
        }
        return {
            get:jsonp,
            init:setDefaults
        };
    }());

    function insertToPage (ext, id, content) {
        if ( ext === 'css' ) {
            var style = doc.createElement('style');
            style.innerText = content;
            style.id = id;
            head.appendChild(style);
        } else {
            var script = doc.createElement('script');
            script.text = content;
            script.id = id;
            script.defer = true;
            body.appendChild(script);
        }
    }

    function getStorage (key) {
        if ( isString(key) ) {
            return storage.getItem(key) ? JSON.parse(storage.getItem(key)) : null;
        }

        if ( isArray(key) ) {
            return key.map(function (attr) { 
                return storage.getItem(attr) ? JSON.parse(storage.getItem(attr)) : storage.getItem(attr); 
            })
        }

        return null;
    }

    function setStorage (key, obj) {
        if ( !isObject(obj) ) {
            return;
        }

        storage.setItem(key, JSON.stringify(obj));
    }

    function removeStorage (key) {
      if ( isString(key) ) {
        return storage.removeItem(key)
      }
      if ( isArray(key) ) {
        return key.forEach(function (k) { 
            return storage.removeItem(k); 
        })
      }
    }

    function eachStorage (key) {
        var i    = 0,
            sarr = [];
        while ( global["localStorage"].key(i) ) {
            var _key = global["localStorage"].key(i)
            if ( new RegExp(key).test(_key) ) {
                sarr.push(_key)
            }
            i++
        }
        return sarr;
    }

    var Ljstore = function (obj) {
        obj = obj || {};
        if ( !isObject(obj) ) {
            throw new Error('Parameter 1 must be the object type');
            return;
        }
        /* store all static source */
        this._sources = [];
        /* prefix of key */
        this.prefix = "ljstore_";
        /* support store file type */
        this.supportExt = ['js','css'];
        /* default config */
        this._config = {
            timeout: 60000,
            expireTime: null
        }
        /* pub sub */
        this._listeners = {}
        mix(this._config, obj);
        
        JSONP.init({
            callbackName: 'callback',
            error : function(obj){
                this.emit('error','[network error] ' + obj.url + ' has a error')
            }.bind(this)
        });
    }

    Ljstore.prototype.add = function (source) {
        if ( !isArray(source) ) {
            if ( isObject(source) ) {
                source = [source];
            } else {
                return;
            }
        }

        /* prevent repeat load static file */
        source = uniqueArr(source, "key");

        var _insertKey  = function (opt) {
            var _options   = merge(this._config, opt, true);
            _options.key   = this.prefix + (_options.key || _options.url);
            _options.key   += "@" + (global[_options.key] || '')
            _options.ext   = suffix(_options.url);
            _options.stime = Date.now();
            if ( !~this.supportExt.indexOf(_options.ext) ) {
                throw new Error('invalid file type');
                return;
            }
            return _options;
        }

        var _checkParam = function (obj) {
            if ( !obj.key || !/^[a-zA-z0-9_]+$/.test(obj.key) ) {
                throw new Error('invalid key')
                return;
            }

            if ( !obj.url || !isUrl(obj.url) ) {
                throw new Error('invalid url')
            }

            this._sources.push(_insertKey.call(this, obj))
        }

        source.forEach(function (item) {
            _checkParam.call(this, item);
        },this)
    }

    Ljstore.prototype.load = function (sync, cb) {
        sync = !!sync;
        cb   = cb || noop;
        var _this = this;
        if ( sync ) {
            var _remote = [],
                _exist  = [];
            this._sources.forEach(function (v) {
                var _content = isLocal(v);

                if ( _content ) {
                    _exist.push({
                        'content' : _content,
                        'id' : v.key,
                        'ext' : v.ext
                    });
                } else {
                    _exist.push(v.key);
                    _remote.push(v);
                }
            })

            if ( _remote.length ) {
                eachOf(_remote, function (item, index, next) {
                    var jsonTimer = timeout(function (cb) {
                        JSONP.get(item.url, function (response) {
                            cb();
                            var _index = _exist.indexOf(item.key);
                            if ( _index !== -1 ) {
                                _exist.splice(_index, 1, {
                                    'ext' : item.ext,
                                    'id' : item.key,
                                    'content' : response.content
                                })
                            }
                            item.content = response.content;
                            removeStorage(eachStorage(item.key.split("@")[0]))
                            setStorage(item.key, item);
                            next()
                        })
                    }, 5000)

                    jsonTimer(function (err) {
                        if ( err && err === 'TIMEOUT' ) {
                            _this.emit('error','[network timeout] ' + item.url + ' timed out')
                            next()
                        }
                    })
                }, function () {
                    _exist.forEach(function (file) {
                        insertToPage(file.ext, file.id, file.content);
                    })
                    this._sources = [];
                    cb();
                },this)
            } else {
                _exist.forEach(function (file) {
                    insertToPage(file.ext, file.id, file.content);
                })
                this._sources = [];
                cb();
            }
        } else {
            eachOf(this._sources, function (item, index, next) {
                var _content = isLocal(item);

                if ( _content ) {
                    insertToPage(item.ext, item.key, _content);
                } else {
                    var jsonTimer = timeout(function (cb) {
                        JSONP.get(item.url, function (response) {
                            cb()
                            insertToPage(item.ext, item.key, response.content);
                            item.content = response.content;
                            removeStorage(eachStorage(item.key.split("@")[0]))
                            setStorage(item.key, item)
                            next()
                        })
                    }, 5000)

                    jsonTimer(function (err) {
                        if ( err && err === 'TIMEOUT' ) {
                            _this.emit('error','[network timeout] ' + item.url + ' timed out')
                            next()
                        }
                    })
                }
                    
            }, function () {
                this._sources = [];
                cb();
            }, this)
        }

        function isLocal (obj) {
            var _local   = getStorage(obj.key),
                _current = Date.now(),
                _maxAge  = obj.expireTime * 60 * 1000;

            return (_local && _local.url === obj.url && _current <  (obj.stime + _maxAge)) ? _local.content : null;
        }
    }

    Ljstore.prototype.insert = function (source, cb) {
        cb = cb || noop;
        if ( !isArray(source) ) {
            if ( isObject(source) ) {
              source = [source];
            } else {
              return;
            }
        }

        this.add(source);
        if ( this._sources.length === 1 ) {
            this.load(false, function () {
                cb();
            });
        }
    }

    Ljstore.prototype.on = function( event, listener ){
        if ( typeof this._listeners[event] !== "undefined" ) {
            this._listeners[event].push(listener);
        } else {
            this._listeners[event] = [listener];
        }
    }

    Ljstore.prototype.emit = function( event, data ){
        if ( typeof this._listeners[event] !== "undefined" ) {
            for ( var i = 0; i < this._listeners[event].length; i++ ) {
                try{
                    this._listeners[event][i].call(this,data);
                }catch(e){
                    console.log(e.stack);
                }
            }
        }
    }
    return Ljstore;
})))