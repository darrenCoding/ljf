
'use strict';

const qr     = require('qr-image');
const fs     = require('fs');
const opener = require('opener');
const path   = require('path');

let qrcode = module.exports = {};

qrcode.create = (link) => {
    let qr_png   = qr.image(link),
        qr_root  = path.join(__dirname, '../'),
        qr_path  = qr_root + Date.now() + '_qrcode.png',
        qr_write = fs.createWriteStream(qr_path)
    qr_png.pipe(qr_write);
    qr_write.on("error", (err) => {
        ljserver.log.error(err);
    })
    qr_write.on("finish", () => {
        opener(qr_path);
    })
}
