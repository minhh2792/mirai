const request = require("request");
const fs = require("fs");
module.exports = {
  api: function(text, callback) {
    let url = `http://ip-api.com/json/${encodeURIComponent(text)}?fields=61209`;
    let savefile = fs.createWriteStream(__dirname + "/src/findlocaltion.json");
    request({
      uri: url
    })
      .pipe(savefile)
      .on("close", () => {
        callback();
      });
  }
};
