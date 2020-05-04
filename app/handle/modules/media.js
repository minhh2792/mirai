var ytdl = require("ytdl-core");
var ffmpeg = require("fluent-ffmpeg");
var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
var fs = require("fs");
var request = require("request");
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = {
	youtubeVideo: function(text, callback) {
		ytdl(text)
		.pipe(fs.createWriteStream(__dirname + "/../src/video.mp4"))
		.on("close", function() {
			callback();
		});
	},
	youtubeMusic: function(text, callback) {
		ffmpeg()
		.input(ytdl(text))
		.toFormat("mp3")
		.pipe(fs.createWriteStream(__dirname + "/../src/music.mp3"))
		.on("close", function() {
			callback();
		});
	},
	facebookVideo : function(text,callback){
		request({
			uri: text
		})
		.pipe(fs.createWriteStream(__dirname +'/../src/video.mp4', {flags: 'w'}))
		.on('close', () => {
			callback();
		});
	}
};
