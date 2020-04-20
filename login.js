const fs = require("fs");
const login = require("fca-unofficial");
const readline = require("readline");

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const option = {
  logLevel: "silent",
  forceLogin: true,
 userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"
  //* cách lấy userAgent: F12-> tab console gõ 'naigator.userAgent' Link: https://imgur.com/oQ5hUkH
};
// edit email với password ở bên dưới!
const obj = { email: "abc@xyz.com", password: "youcantseemypassword?" };
login(obj, option, (err, api) => {
  if (err) {
    switch (err.error) {
      case "login-approval":
        console.log("Enter code > ");
        rl.on("line", line => {
          err.continue(line);
          rl.close();
        });
        break;
      default:
        console.error(err);
    }
    return;
  }
  // Logged in wirite cookie!
  var json = JSON.stringify(api.getAppState(), null, "\t");
  var ghi = fs.createWriteStream(__dirname + "/appstate.json", { flags: "w" });
  ghi.write(json);
  console.log(json);
});