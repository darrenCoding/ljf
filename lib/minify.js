
'use strict';

var imageminJpegtran = require('imagemin-jpegtran');
var imageminGifsicle = require('imagemin-gifsicle');
var imageminOptipng  = require('imagemin-optipng');
var imageminSvgo     = require('imagemin-svgo');
var prettyBytes      = require('pretty-bytes');
var imagemin         = require('imagemin');
var async            = require('async');
var path             = require('path');
var fs               = require('fs');

var minify = module.exports = {};


var validExts       = ['jpg', 'jpeg', 'png', 'gif', 'svg'], //supported minify image type
    totalBytes      = 0, //total original size
    totalSavedBytes = 0, //total minified size
    totalFiles      = 0; //total minified num

minify.init = function init (input, output) {
    if ( ljserver.file.exists(input)) {
        input = input.replace(/\/$/g, '');
        this.mainHandle(input, output, function () {
            ljserver.log.info('Minified %s images (saved %s)', totalFiles,prettyBytes(totalSavedBytes))
        });
    }
}

minify.mainHandle = function mainHandle (input, output, cb) {
    output = output || input;
    var _diArr = [];
    ljserver.util.eachOfLimit(10, fs.readdirSync(input), function (file, index, go){
        var _stat = fs.statSync(input + '/' + file);
        if ( _stat.isFile() ) {
            if ( ~validExts.indexOf(path.extname(file).toLowerCase().slice(1)) ) {
                var _obuffer = ljserver.file.read(input + '/' + file);
                totalBytes += _obuffer.length;
                imagemin.buffer(_obuffer, {
                    plugins: [
                        imageminGifsicle({optimizationLevel : 3}),
                        imageminJpegtran(),
                        imageminOptipng(),
                        imageminSvgo()
                    ]
                }).then( function (myfile) {
                    ljserver.file.writeFile(output + '/' + file, myfile, 'binary');
                    var _mbuffer = myfile.length,
                        _saved = _obuffer.length - _mbuffer;
                    totalSavedBytes += _saved;
                    totalFiles++;
                    go()
                })
            }else{
                go();
            }
        } else {
            if ( _stat.isDirectory() ) {
                _diArr.push(input + '/' + file);
            }
            go();
        }
    }, function () {
        if ( _diArr.length ) {
            ljserver.util.eachOf(_diArr, function (direct, i, next) {
                mainHandle(direct, null, function () {
                    next()
                })
            }, function () {
                cb();
            })
        } else {
            cb();
        }
    }, this)
}
