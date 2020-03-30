const request = require("request");
const fs = require("fs");
module.exports = {
  api: function(text, goback) {
    let url1 = `http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      text
    )}&appid=081c82065cfee62cb7988ddf90914bdd&units=metric`;
    request({
      uri: url1
    })
      .pipe(
        fs.createWriteStream(__dirname + "/src/weather.json", {
          encoding: "utf8",
          flag: "w"
        })
      )
      .on("close", function() {
        goback();
      });
  }
};
