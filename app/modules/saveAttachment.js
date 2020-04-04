const md5 = require("md5");
const request = require("request-promise").defaults({ encoding: null, timeout: 10 * 1000 });
const fileType = require('file-type');
const fs = require("fs");
const PATH = require('path');
const tempFolder = PATH.resolve(__dirname, '../temp');
module.exports = async function(op) {
    try {
        let buffer = await request(op);
        let { ext, mime } = fileType.fromBuffer(buffer);
        let path = PATH.resolve(tempFolder, `./${md5(new Date() + Math.random())}.${ext}`);
        fs.writeFileSync(`${path}`, buffer);
        return path;
    }
    catch (e) {
        return Promise.reject(e);
    }
}
