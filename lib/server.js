
'use strict';

var http         = require('http');
var https        = require('https');
var fs           = require('fs');
var lsofi        = require('lsofi');
var path         = require('path');
var uri          = require('url');
var mime         = require('mime-types');
var combo        = require('static-combo');
var exec         = require('child_process').exec;
var opener       = require('opener');
var inquirer     = require('inquirer');
var serveIndex   = require('serve-index');
var httpProxy    = require('http-proxy');
var serveStatic  = require('serve-static');
var finalhandler = require('finalhandler');
var file         = require('./file');
var cjson        = require('../config.json');

var slice = Array.prototype.slice;

var proto = module.exports = {};

combo.config({
    'base_path' : cjson.svndev,
    'compress' : false,
    'js_module' : {
        'AMD' : { 
            'baseUrl': cjson.svndev
        }
    }
})

proto.init = function (req, res) {
    if ( req.url !== '/favicon.ico' ){
        /* define req.protocol */
        Object.defineProperty(req, 'protocol', {
            configurable: true,
            enumerable: true,
            get: function protocol () {
              var proto = req.connection.encrypted
                ? 'https'
                : 'http';
              proto = req.headers['X-Forwarded-Proto'] || proto;
              return proto.split(/\s*,\s*/)[0];
            }
        })

        var index  = serveIndex(cjson.svndev, {'icons': true}),
            obj_r  = uri.parse(req.url, true),
            suffix = path.extname(obj_r.pathname).slice(1),
            pname  = obj_r.pathname;
        if ( suffix ) {
            if ( ljserver.first[0] === 'proxy' ) {
                if ( ljserver.args.l ) {
                    if ( /(js|css)+/.test(suffix) ) {
                        proto.local(req, res, suffix);
                    }else{
                        proto.send(req, res);
                    }
                } else {
                    var proxy = httpProxy.createProxyServer({});
                    proto.proxy(req, res, proxy);
                }
            } else {
                if( /^(js|css)+$/.test(suffix) ) {
                    proto.local(req, res, suffix);
                } else {
                    proto.send(req, res);
                }
            }
        }else{
            var done = finalhandler(req, res);
            index(req, res, done);
        }
    }
}

proto.lcb = function () {
    var whole = 'http://' + ljserver.util.getLocalIp() + ':' + this.port;
    ljserver.log.info('ljf running at ' + whole)
    if ( ljserver.args.b ) {
       opener(whole);
    }
}

proto.local = function (req, res, suffix) {
    combo(req.url, function (err, data, deps) {
        if ( err ) {
            this.fail(res, 500, err);
            ljserver.log.errror(err);
        } else {
            this.success(res, suffix, data);
            ljserver.log.info(req.method + ' %s', req.url);
        }
    }.bind(this)); 
}

proto.proxy = function (req, res, proxy) {
    var host = ljserver.config.host,
        target = ljserver.args.t ? ljserver.config.test : ljserver.config.online
    proxy.on('error', function (e) {
        ljserver.log.error(e.message);
    });
    proxy.on('proxyReq', function (proxyReq, req, res, options) {
      proxyReq.setHeader('HOST', host);
      proxyReq.setHeader('X-Real-Ip', ljserver.util.getLocalIp());
      proxyReq.setHeader('X-Forwarded-For', ljserver.util.getLocalIp());
    });

    proxy.web(req, res, {
        target: 'http://' + target,
        changeOrigin : true
    });
    ljserver.log.info(req.method + ' %s', req.url);
}

proto.send = function (req, res) {
    file.sendFile(cjson.svndev + decodeURI(req.url), function (data) {
        if (data) {
            this.success(res, path.extname(req.url), data)
        } else {
            this.fail(res,404);
        }
    }.bind(this))
    ljserver.log.info(req.method + ' %s', req.url);
}

proto.success = function (res, type, data) {
    var length = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');
    res.writeHead(200, {
        'Content-Type':  mime.lookup(type) + '; charset=UTF-8',
        'Content-Length' : length
    });
    res.end(new Buffer(data));
}

proto.fail = function (res, code, msg) {
    var err = msg ? ('<p>' + msg + '</p>') : '<center><h1>404 Not Found</h1></center><hr><center>';
    res.writeHead(code, {
        'Content-Type' : 'text/html;charset=UTF-8'
    });
    res.end(err);
}

proto.error = function (error) {
    if ( error.code === 'EADDRINUSE' || error.code === 'EACCES' ){
        ljserver.log.error('ljf : Port %s has used', this.port);
    }
}

proto.listen = function () {
    var iport = ljserver.first[0] === 'server' ? ljserver.args.port : 80,
        key = ljserver.args.c || path.resolve(__dirname, '../', ljserver.config.https.cert),
        crt = ljserver.args.k || path.resolve(__dirname, '../', ljserver.config.https.crt);
    this.key = key;
    this.crt = crt;
    ljserver.util.getPort(iport).then(function (port) {
        if ( port ) {
            startServer.call(this, port);
        } else {
            this.usedPort(iport).then(function () {
                startServer.call(this, iport);
            }.bind(this));
        }
    }.bind(this))

    /* https */
    var httpsModule = https.Server({
        key: fs.readFileSync(key),
        cert: fs.readFileSync(crt)
    }, this.init);
    httpsModule.listen(443, function (err) {
        if ( err ){
            ljserver.log.error(err);
        }
    })

    function startServer (port) {
        this.port = port;
        var server = http.createServer(this.init);
        server.listen.call(server, port, this.lcb.bind(this));
        server.on('error', this.error.bind(this));
    }
}

proto.usedPort = function (port) {
    return new Promise( function (resolve, reject) {
        if ( ljserver.util.isWin() ) {
            //window
        } else {
            if ( port !== 80 ) {
                inquirer.prompt([
                    {
                    'type' : 'confirm',
                    'name' : 'killport',
                    'message' : 'The port ' + port + ' is listening, Do you want to kill it ?',
                    'default' : false
                  }
                ]).then( function (answers) {
                    if ( answers.killport ) {
                        ljserver.util.killPort(port).then(function (iskill) {
                            if ( iskill ) {
                                ljserver.log.info('%s', 'kill success！');
                                resolve();
                            }
                        })
                    } else {
                        process.exit(0);
                    }
                })
            } else {
                resolve();
            }
        }
    })
}