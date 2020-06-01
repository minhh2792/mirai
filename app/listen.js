const modules = require("./modules");
const config = require("../config");
module.exports = function({ api, models, __GLOBAL }) {
	const User = require("./controllers/user")({ models, api });
	const Thread = require("./controllers/thread")({ models, api });
	const Rank = require("./controllers/rank")({ models, api });
	const economy = require("./controllers/economy")({ models, api });
	(async function init() {
		modules.log("Khởi tạo biến môi trường.");
		__GLOBAL.userBlocked = (await User.getUsers({ block: true })).map(e => e.uid);
		__GLOBAL.threadBlocked = (await Thread.getThreads({ block: true })).map(e => e.threadID);
		__GLOBAL.threadBlockedResend = (await Thread.getThreads({ blockResend: true })).map(e => e.threadID);
		modules.log("Khởi tạo biến môi trường xong.");
	})();
	const handleMessage = require("./handle/message")({ api, modules, config, __GLOBAL, User, Thread, Rank, economy });
	const handleEvent = require("./handle/event")({ api, modules, config, __GLOBAL, User, Thread });
	const handleUnsend = require("./handle/unsend")({ api, modules, config, __GLOBAL, User });
	modules.log(config.prefix || "<Không có>", "[ PREFIX ]");
	modules.log(`${api.getCurrentUserID()} - ${config.botName}`, "[ UID ]");
	modules.log("Bắt đầu hoạt động!");
	modules.log("This bot was made by Catalizcs(roxtigger2003) and SpermLord(spermlord)");
	return function(error, event) {
		if (error) return modules.log(error, 2);
		switch (event.type) {
			case "message":
			case "message_reply":
				handleMessage({ event });
				break;
			case "message_unsend":
				handleUnsend({ event });
				break;
			case "event":
				handleEvent({ event });
				break;
			default:
				return;
				break;
		}
	};
};
