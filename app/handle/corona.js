const request = require("request");
const fs = require("fs");
module.exports = {
  take: function(callback) {
    let url = `https://code.junookyo.xyz/api/ncov-moh/data.json`;
    request({
      uri: url
    })
      .pipe(fs.createWriteStream(__dirname + "/src/corona.json"))
      .on("close", function() {
        callback();
      });
  }
};
