
'use strict';

const http         = require('http');
const https        = require('https');
const fs           = require('fs');
const lsofi        = require('lsofi');
const path         = require('path');
const uri          = require('url');
const mime         = require('mime-types');
const combo        = require('static-combo');
const exec         = require('child_process').exec;
const opener       = require('opener');
const inquirer     = require('inquirer');
const serveIndex   = require('serve-index');
const httpProxy    = require('http-proxy');
const serveStatic  = require('serve-static');
const finalhandler = require('finalhandler');
const file         = require('./file');
const cjson        = require('../config.json');

const ROUTE = {
    "local" : "l",
    "test" : "t",
    "online" : "o"
}

let proto = module.exports = {};

proto.init = (req, res) => {
    if ( req.url !== '/favicon.ico' ){
        /* define req.protocol */
        Object.defineProperty(req, 'protocol', {
            configurable: true,
            enumerable: true,
            get: function protocol () {
              let proto = req.connection.encrypted
                ? 'https'
                : 'http';
              proto = req.headers['X-Forwarded-Proto'] || proto;
              return proto.split(/\s*,\s*/)[0];
            }
        })

        let index  = serveIndex(cjson.svndev, {'icons': true}),
            obj_r  = uri.parse(req.url, true),
            suffix = path.extname(obj_r.pathname).slice(1),
            args   = ( function(){
                return ['l','t','o'].filter( (val) => {
                    return ljserver.args[val];
                });
            }())[0],
            env;
        if ( suffix ) {
            if ( ljserver.first[0] === 'proxy' ) {
                env = ROUTE[ljserver.hosts.readHosts()[req.url.slice(1)]] || args || 'l';
                if ( env === 'l' ) {
                    if ( /(js|css)+/.test(suffix) ) {
                        proto.local(req, res, suffix);
                    }else{
                        proto.send(req, res);
                    }
                } else {
                    let proxy = httpProxy.createProxyServer({});
                    proto.proxy(req, res, proxy, env);
                }
            } else {
                if( /^(js|css)+$/.test(suffix) ) {
                    proto.local(req, res, suffix);
                } else {
                    proto.send(req, res);
                }
            }
        }else{
            let done = finalhandler(req, res);
            index(req, res, done);
        }
    }
}

proto.lcb = function () {
    let whole = 'http://' + ljserver.util.getLocalIp() + ':' + this.port;
    ljserver.log.info(`ljf running at ${whole}`)
    if ( ljserver.args.b ) {
       opener(whole);
    }
}

proto.local = function (req, res, suffix) {
    combo.config({
        'base_path' : cjson.svndev,
        'compress' : false,
        'js_module' : {
            'AMD' : { 
                'baseUrl': cjson.svndev
            }
        }
    })
    combo(req.url, (err, data, deps) => {
        if ( err ) {
            this.fail(res, 500, err);
            ljserver.log.error(err);
        } else {
            this.success(res, suffix, data);
            ljserver.log.info(`${req.method} ${req.url}`);
        }
    }); 
}

proto.proxy = (req, res, proxy, env) => {
    let host   = ljserver.config.host,
        target = (env === 't') ? ljserver.config.test : ljserver.config.online
    proxy.on('error', (e) =>{
        ljserver.log.error(e.message);
    });
    proxy.on('proxyReq', (proxyReq, req, res, options) => {
      proxyReq.setHeader('HOST', host);
      proxyReq.setHeader('X-Real-Ip', ljserver.util.getLocalIp());
      proxyReq.setHeader('X-Forwarded-For', ljserver.util.getLocalIp());
    });

    proxy.web(req, res, {
        target: 'http://' + target,
        changeOrigin : true
    });
    ljserver.log.info(`${req.method} ${req.url}`);
}

proto.send = function (req, res) {
    file.sendFile(cjson.svndev + decodeURI(req.url), (data) => {
        if (data) {
            this.success(res, path.extname(req.url), data)
        } else {
            this.fail(res,404);
        }
    })
    ljserver.log.info(`${req.method} ${req.url}`);
}

proto.success = (res, type, data) => {
    let length = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');
    res.writeHead(200, {
        'Content-Type':  mime.lookup(type) + '; charset=UTF-8',
        'Content-Length' : length
    });
    res.end(new Buffer(data));
}

proto.fail = (res, code, msg) => {
    let err = msg ? ('<p>' + msg + '</p>') : '<center><h1>404 Not Found</h1></center><hr><center>';
    res.writeHead(code, {
        'Content-Type' : 'text/html;charset=UTF-8'
    });
    res.end(err);
}

proto.error = (error) => {
    if ( error.code === 'EADDRINUSE' || error.code === 'EACCES' ){
        ljserver.log.error(`ljf : Port ${proto.port} has used`);
    }
}

proto.listen = function () {
    let iport = ljserver.first[0] === 'server' ? ljserver.args.port : 80,
        key   = ljserver.args.c || path.resolve(__dirname, '../', ljserver.config.https.cert),
        crt   = ljserver.args.k || path.resolve(__dirname, '../', ljserver.config.https.crt);
    this.key = key;
    this.crt = crt;
    ljserver.util.getPort(iport).then( (port) => {
        if ( port ) {
            startServer.call(this, port);
        } else {
            this.usedPort(iport).then( () => {
                startServer.call(this, iport);
            });
        }
    })

    /* https */
    let httpsModule = https.Server({
        key: fs.readFileSync(key),
        cert: fs.readFileSync(crt)
    }, this.init);
    httpsModule.listen(443, (err) => {
        if ( err ){
            ljserver.log.error(err);
        }
    })

    function startServer (port) {
        this.port = port;
        let server = http.createServer(this.init);
        server.listen.call(server, port, this.lcb.bind(this));
        server.on('error', this.error.bind(this));
    }
}

proto.usedPort = (port) => {
    return new Promise( (resolve, reject) => {
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
                ]).then( (answers) => {
                    if ( answers.killport ) {
                        ljserver.util.killPort(port).then( (iskill) => {
                            if ( iskill ) {
                                ljserver.log.info('kill success！');
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