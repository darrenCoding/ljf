
'use strict';

const imageminJpegtran = require('imagemin-jpegtran');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminOptipng  = require('imagemin-optipng');
const imageminSvgo     = require('imagemin-svgo');
const prettyBytes      = require('pretty-bytes');
const imagemin         = require('imagemin');
const async            = require('async');
const path             = require('path');
const fs               = require('fs');

let minify = module.exports = {};


let validExts       = ['jpg', 'jpeg', 'png', 'gif', 'svg'], //supported minify image type
    totalBytes      = 0, //total original size
    totalSavedBytes = 0, //total minified size
    totalFiles      = 0; //total minified num

minify.init = function (input, output) {
    if ( ljserver.file.exists(input)) {
        input = input.replace(/\/$/g, '');
        this.mainHandle(input, output, () => {
            ljserver.log.info(`Minified ${totalFiles} images (saved ${prettyBytes(totalSavedBytes)})`)
        });
    }
}

minify.mainHandle = function mainHandle (input, output, cb) {
    output = output || input;
    let _diArr = [];
    ljserver.util.eachOfLimit(10, fs.readdirSync(input), (file, index, go) => {
        let _stat = fs.statSync(input + '/' + file);
        if ( _stat.isFile() ) {
            if ( ~validExts.indexOf(path.extname(file).toLowerCase().slice(1)) ) {
                let _obuffer = ljserver.file.read(input + '/' + file);
                totalBytes  += _obuffer.length;
                imagemin.buffer(_obuffer, {
                    plugins: [
                        imageminGifsicle({optimizationLevel : 3}),
                        imageminJpegtran(),
                        imageminOptipng(),
                        imageminSvgo()
                    ]
                }).then( (myfile) => {
                    ljserver.file.writeFile(output + '/' + file, myfile, 'binary');
                    let _mbuffer = myfile.length,
                        _saved   = _obuffer.length - _mbuffer;
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
    }, () => {
        if ( _diArr.length ) {
            ljserver.util.eachOf(_diArr, (direct, i, next) => {
                mainHandle(direct, null, () => {
                    next()
                })
            }, () => {
                cb();
            })
        } else {
            cb();
        }
    })
}
