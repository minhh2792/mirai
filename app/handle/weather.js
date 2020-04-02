const request = require("request");
const fs = require("fs");
module.exports = {
    api : function(text,callback){
        let url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&appid=081c82065cfee62cb7988ddf90914bdd&units=metric`;
        let savefile = fs.createWriteStream(__dirname +'/src/weather.json', {flags: 'w'});
        request({
            uri: url
        })
        .pipe(savefile)
        .on('close', () => {
            callback();
        });
    }
}