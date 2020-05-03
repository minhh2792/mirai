const request = require("request");
const fs = require("fs");
module.exports = {
	vn: function(text,callback){
		request({
			uri: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`
		})
		.pipe(fs.createWriteStream(__dirname +'/../src/say.mp3'))
		.on('close', function() {
			callback();
		});
	},
	other: function(text,key,callback){
		request({
			uri: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${key}&client=tw-ob`
		})
		.pipe(fs.createWriteStream(__dirname+'/../src/say.mp3'))
		.on('close',function(){
			callback();
		})
	}
}
