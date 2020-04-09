const request = require("request");
const fs = require("fs");
module.exports = {
    take : function(text,callback){
        let url = `http://ghuntur.com/simsim.php?lc=vn&deviceId=&bad=0&txt=${encodeURIComponent(text)}`
        request({
            uri: url
        })
        .pipe(fs.createWriteStream(__dirname +'/../src/simsimi.txt'))
        .on('close', function() {
            callback();
        });
    }
}