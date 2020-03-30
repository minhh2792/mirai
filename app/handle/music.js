var ytdl = require("ytdl-core");
var ffmpeg = require("fluent-ffmpeg");
var fs = require("fs");

module.exports = {
  youtube: function(text, callback) {
    var url = `${text}`;
    ffmpeg()
      .input(ytdl(url))
      .toFormat("mp3")
      .pipe(fs.createWriteStream(__dirname + "/src/music.mp3"))
      .on("close", function() {
        callback();
      });
  }
};
