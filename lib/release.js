
'use strict';

var request = require('request');
var path    = require('path');
var spawn   = require('cross-spawn');
var cjson   = require('../config.json');

var release = module.exports = {},
    suppExt = ['css','js']; 

release.init = function () {
    var remote = path.join(cjson.svnonline,process.cwd().replace(cjson.svndev, ''));
    this.args  = [path.resolve(__dirname,'../deploy.sh'), process.cwd(), remote]
    if ( ljserver.args.d ) {
        this.args.splice(1 ,0, process.cwd() + '/');
    } else {
        if ( ljserver.first.length > 1 ) {
            this.files = ljserver.first.slice(1);
            this.files = this.files.map(path.normalize);
            if ( ljserver.file.exists(this.fullPath(this.files)) ) {
                if ( ~process.cwd().indexOf(cjson.svndev) ) {
                    this.args.splice(1, 0, this.files.join(';'));
                } else {
                    return ljserver.log.error('The current directory is wrong，please check your path')
                }
            }
        }
    }
    if ( this.args.length > 3 ) {
        var cmsg = ljserver.args.m ? ljserver.args.m : 'update';
        this.args.push(cmsg);
        this.submit();
    }
}

release.submit = function () {
    var deploy = spawn('sh', this.args);
    deploy.stdout.setEncoding('utf8');
    deploy.stdout.pipe(process.stdout);
    deploy.stderr.on('data', function (chunk) {
        ljserver.log.error(chunk.toString());
    })
    deploy.stdout.on('end', function () {
        if( ljserver.args.u ) {
            this.clearCache(ljserver.args.u.split("??"));
        } else {
            if ( this.files ) {
                this.clearCache(this.fullPath(this.files))
            } else {
                this.clearCache(ljserver.file.readDir(this.args[2],suppExt));
            }
        }
    }.bind(this))
}

release.fullPath = function (files) {
    var fpath = Array.isArray(files) ? files : [files];
    return fpath.map(function (item) {
        return path.join(process.cwd(), item)
    })
}

release.clearCache = function (pathList) {
    var pathList = Array.isArray(pathList) ? pathList : [pathList],
        options = {
            'headers' : {
                'HOST' : 'admin.imgcdn.leju.com'
            },
            'timeout' : 10000
        }
    pathList = pathList.map(function (item) {
        return item.replace(/^.+\/trunk\//, '');
    })
    pathList.forEach(function (paths) {
        options.url = ljserver.config.cache.index + '?path=' + paths;
        ljserver.log.info('Clearing: %s ', paths);
        request(options, function (err, response, body) {
            if ( !err && response.statusCode == 200 ) {
                var matchs = body.match(/<input name="chkItem" type="checkbox" value="(\d{19})"\/>/);   
                if ( matchs ) {
                    options.url = ljserver.config.cache.clear + '?url_id=' + matchs[1];
                    request(options, function (error, res, body) {
                        if ( !error && res.statusCode == 200 ) {
                            ljserver.log.info('Clear success: %s ', paths);
                        } else {
                            ljserver.log.error(error);
                        }
                    })
                } else {
                    ljserver.log.error('Not Found: %s', paths);
                }
            } else {
                ljserver.log.error(err || 'Request fail, please try again');
            }
        });
    });
}
