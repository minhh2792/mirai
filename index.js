require("dotenv").config();
const login = require("./app/login");
const { Sequelize, sequelize, Op } = require("./database");
const logger = require("./app/modules/log.js");
const { appStateFile } = require("./config");
const fs = require("fs");
const express = require("express");
const app = express();
const cmd = require('node-cmd');
const request = require("request");
const __GLOBAL = new Object({
	threadBlocked: new Array(),
	userBlocked: new Array(),
	unsend: new Array(),
	threadBlockResend: new Array()
});

app.get("/", (request, response) => response.sendFile(__dirname + "/view/index.html"));
app.get("/dbv", (request, response) => response.sendFile(__dirname + "/config/dbviewer/index.html"));
app.use(express.static(__dirname + '/config'));
app.use(express.static(__dirname + '/config/dbviewer'));

const listener = app.listen(process.env.PORT, () => console.log("đã mở tại port: " + listener.address().port));

setTimeout(() => {
	console.log("refreshing!");
	cmd.run("pm2 restart 0");
}, process.env.TIME_RERESH || '600000');

var facebook = ({ Op, models }) => {
	login({ appState: require(appStateFile) }, (error, api) => {
		if (error) return logger(error, 2);
		fs.writeFileSync(appStateFile, JSON.stringify(api.getAppState(), null, "\t"));
		api.listenMqtt(require("./app/listen")({ api, Op, models, __GLOBAL }));
	});
}

sequelize.authenticate().then(
	() => logger("Kết nối cơ sở dữ liệu thành công!", 0),
	() => logger("Kết nối cơ sở dữ liệu thất bại!", 2)
).then(() => {
	let models = require("./database/model")({ Sequelize, sequelize });
	facebook({ Op, models });
}).catch(e => logger(`${e.stack}`, 2));
// Full code by Catalizcs and SpermLord
