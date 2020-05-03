const login = require("./login");
const modules = require("../modules");
module.exports = async function({ appState }, callback) {
	if (typeof callback !== "function") return console.error("You must pass a function");
	let api;
	try {
		api = await login({ appState }).catch(() => modules.log("Chưa có appstate!!"));
		callback(undefined, api);
	}
	catch (e) {
		callback(e);
	}
}
