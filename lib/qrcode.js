
'use strict';

var qr     = require('qr-image');
var fs     = require('fs');
var opener = require('opener');
var path   = require('path');

var qrcode = module.exports = {};

qrcode.create = function (link) {
    var qr_png   = qr.image(link),
        qr_root  = path.join(__dirname, '../'),
        qr_path  = qr_root + Date.now() + '_qrcode.png',
        qr_write = fs.createWriteStream(qr_path)
    qr_png.pipe(qr_write);
    qr_write.on("error", function (err) {
        ljserver.log.error(err);
    })
    qr_write.on("finish", function () {
        opener(qr_path);
    })
}
