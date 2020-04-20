const request = require("request");
const fs = require("fs");
module.exports = {
    take : function(text,callback){
        let url = text;
        let savefile = fs.createWriteStream(__dirname +'/../src/video.mp4', {flags: 'w'});
        request({
            uri: url
        })
        .pipe(savefile)
        .on('close', () => {
            callback();
        });
    }
}