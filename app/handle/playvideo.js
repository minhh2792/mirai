var ytdl = require("ytdl-core");
var fs = require("fs");

module.exports = {
  youtube: function(text, callback) {
    var url = `${text}`;

    ytdl(url)
      .pipe(fs.createWriteStream(__dirname + "/src/video.mp4"))
      .on("close", function() {
        callback();
      });
  }
};
