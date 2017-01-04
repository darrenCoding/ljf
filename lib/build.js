
'use strict';

const fs       = require('fs');
const path     = require('path');
const uri      = require('url');
const combo    = require('static-combo');
const cjson    = require('../config.json');

let compile  = module.exports = {};


combo.config({
    'base_path' : cjson.svndev,
    'compress' : false,
    'js_module' : {
        'AMD' : { 
            'baseUrl': cjson.svndev
        }
    }
})

compile.init = function (env) {
    let mapFile = path.join(process.cwd(), '/', ljserver.config.build.resource);
    this.content = ljserver.file.readJSON(mapFile);
    this.env = env || 'dev';
    this.buildFile = path.join(process.cwd(), '/', ljserver.config.build.create);
    if ( this.content ) {
        ljserver.log.info(`Using resourceMap.json ${mapFile}`)
        ljserver.log.info('Starting build');
        this.parse()
    }
}

compile.parse = function () {
    this.buildObj = {};
    let rules = this.content.rules;
    ljserver.util.eachOf(Object.keys(rules), (ikey, index, go) => {
        let _assets = [],
            _urlArr = [];
        if ( Array.isArray(rules[ikey]) ) {
            rules[ikey].forEach((asset) => {
                if ( ljserver.util.isObject(asset) ){
                    _assets.push(asset)
                }else{
                    if ( asset in this.content['resource'] ) {
                        _assets.push.apply(_assets, this.content['resource'][asset])
                    } else {
                        ljserver.log.error(`Uncaught ReferenceError: ${asset} is not defined`);
                    }
                }
            })
        } else {
            if ( rules[ikey] in this.content['resource'] ) {
                _assets = this.content['resource'][rules[ikey]]
            } else {
                ljserver.log.error(`Uncaught ReferenceError: ${rules[ikey]} is not defined`);
            }
        }
        
        ljserver.util.eachOfSeries(_assets, (iurl, i, next) => {
            this.comboFiles(iurl, (combine) => {
                ljserver.log.info(combine);
                _urlArr.push(combine);
                next();
            });
        }, () => {
            let _env = this.content['domain'][this.env].replace(/(http|https):\/\//,'')
            this.buildObj[_env + ikey] = _urlArr;
            go();
        })
    }, () => {
        this.injectStore( () => {
            this.injectContent(this.buildObj);
        })
    })
}

compile.comboFiles = function (obj, cb) {
    let _root = process.cwd().replace(cjson.svndev, '') + '/' ;
    obj.asset = Array.isArray(obj.asset) ? obj.asset : [obj.asset];
    obj.asset = obj.asset.map((url, i) => {
        return url in this.content['alias'] ? this.content['alias'][url] : url;
    })
    let _ext = path.extname(obj.asset[0]) || '',
        _urlPath = obj.asset.sort((fp) =>  {
        return path.isAbsolute(fp) ? 1 : -1
    }).map((item, index) => {
        let _base = path.dirname(item) + '/';
        item = item.replace(_ext, '');
        if ( path.isAbsolute(item) ) {
            if (!index) {
                return '/' + item.slice(1);
            } else {
                return ';' + item.slice(1);
            }
        } else {
            if (!index) {
                return _root + item;
            } else {
                return ',' + item.replace(_base, '');
            }
        }
    }).join('') + _ext;
    this.wholePath = '//' + ljserver.config.build.domain + _urlPath;
    this.judgeMd5(this.wholePath).then((url) => {
        cb(url + (obj.param ? ('?' + obj.param) : ''))
    }, (err) => {
        ljserver.log.error(err);
    })
}

compile.judgeMd5 = function (url, md5) {
    let _str;
    return new Promise( (resolve, reject) => {
        url = uri.parse(url).protocol || 'http:' + url;
        combo(url, (err, data, deps) => {
            if ( err ){
                reject(err);
            } else {
                _str = md5 ? ljserver.util.md5(data) : (url + '_@' + ljserver.util.md5(data) + '.js')
                resolve(_str);
            }
        }); 
    })
}

compile.injectStore = function (cb) {
    if ( this.content.localStorage ) {
        let _basicArr = [];
        ljserver.util.eachOf(this.content.localStorage, (val, key, go) => {
            this.judgeMd5('//' + ljserver.config.build.domain + val, true).then((md5) => {
                _basicArr.push(key + "&&" + md5);
                go()
            }, (err) => {
                ljserver.log.error(err);
            })
        }, () => {
            _basicArr = _basicArr.map((local) => {
                let _lp = local.split("&&");
                return '  global["ljstore_' + _lp[0] + '"] = ' + '"' + _lp[1] + '"' + '\n'
            }).join("")
            this.localStr = _creatResult(_basicArr);
            cb && cb.call(this)
        })
    } else {
        cb && cb.call(this)
    }

    function _creatResult (str) {
        return ['\n/**',
            '\n  localStorage version',
            '\n*/',
            '\n',
            str,
        ].join("");
    }
}

compile.injectContent = function (uobj) {
    this.urlKey = JSON.stringify(uobj, null, 4);
    this.jsContent = ljserver.file.read(path.join(__dirname, '../deps/loader.min.js')).toString();
    this.ljStore =  this.content.localStorage ? ('\n' + ljserver.file.read(path.join(__dirname, '../deps/ljstore.min.js')).toString()) : '';
    fs.writeFileSync(path.join(process.cwd() + '/' + ljserver.config.build.create), this.createStr());
    ljserver.log.info('Finished build');
    ljserver.log.info(path.join(process.cwd() + '/' + ljserver.config.build.create));
}

compile.createStr = function () {
    return [
        '(function(global,doc){\n',
            this.jsContent,
            this.ljStore,
            '\nvar urlKey = ',
            this.urlKey,
            '\nfor(var attr in urlKey){',
            '\n  if(new RegExp(attr,"i").test(window.location.host + window.location.pathname)){',
            '\n    Loader(urlKey[attr])',
            '\n  }',
            '\n}',
            this.localStr,
        '\n})(window, document);'
    ].join('')
}