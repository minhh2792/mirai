const fs = require("fs");
module.exports = function ({ api, modules, config, __GLOBAL, User, Thread }) {
	return function ({ event }) {
		switch (event.logMessageType) {
			case "log:subscribe":
				if (!fs.existsSync(__dirname + "/src/groupID.json")) {
					var data = [];
					api.getThreadList(100, null, ["INBOX"], function(err, list) {
						if (err) throw err;
						list.forEach(item => {
							if (item.isGroup == true) data.push(item.threadID);
						});
						fs.writeFileSyns(__dirname + "/src/groupID.json", JSON.stringify(data));
					});
				}
				var groupIDFile = fs.readFileSync(__dirname + "/src/groupID.json");
				var groupIDData = JSON.parse(groupIDFile);
				if (!groupIDData.some(item => item == event.threadID)) {
					groupIDData.push(event.threadID);
					fs.writeFileSync(__dirname + "/src/groupID.json", JSON.stringify(groupIDData));
				}
				for (var i = 0; i < event.logMessageData.addedParticipants.length; i++) {
					if (event.logMessageData.addedParticipants[i].userFbId == api.getCurrentUserID()) {
						Thread.createThread(event.threadID);
						api.sendMessage("Đã kết nối thành công!\nVui lòng sử dụng help all để biết thêm chi tiết lệnh >w<", event.threadID);
						api.changeNickname(config.botName, event.threadID, api.getCurrentUserID());
					}
					else {
						let uid = event.logMessageData.addedParticipants[i].userFbId;
						User.findUser(uid).then((user) => {
							if (user == false) User.createUser(uid, true, event.threadID);
							else
								User.getName(uid).then(name => {
									api.sendMessage({
										body: "Chào mừng " + name + " đã vào group",
										mentions: [
											{
												tag: name,
												id: uid
											}
										]
									}, event.threadID)
								})
						})
					}
				}
				break;
			case "log:unsubscribe":
				User.getName(event.logMessageData.leftParticipantFbId).then(name => api.sendMessage("Oops, " + name + " vừa tàng hình bay đi", event.threadID));
				break;
			case "log:thread-icon":
				break;
			case "log:user-nickname":
				break;
			case "log:thread-color":
				break;
			case "log:thread-name":
				Thread.changeName(event.threadID, event.logMessageData.name);
				break;
		}
	}
}