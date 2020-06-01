const fs = require("fs");
const login = require("fca-unofficial");
const readline = require("readline");
const { mailFB, passFB } = require("./config");

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const option = {
	logLevel: "silent",
	forceLogin: true,
	userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36"
};

const obj = {
	email: mailFB,
	password: passFB
};
login(obj, option, (err, api) => {
	if (err) {
		switch (err.error) {
			case "login-approval":
				console.log("Nhập mã xác minh 2 lớp: ");
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
	var json = JSON.stringify(api.getAppState(), null, "\t");
	var addNew = fs.createWriteStream(__dirname + "/appstate.json", { flags: "w" });
	addNew.write(json);
	console.log("Đã ghi xong appstate!");
});
