module.exports = function({ api, __GLOBAL, User }) {
	return function ({ event }) {
		var getMsg = __GLOBAL.unsend.find(item => item.msgID == event.messageID);
		User.getName(event.senderID).then(name => {
			if (event.senderID != api.getCurrentUserID())
				return api.sendMessage({
					body: name + " vừa gỡ một tin nhắn:\n" + getMsg.msgBody,
					mentions: [
						{
							tag: name,
							id: event.senderID
						}
					]
				}, event.threadID);
		})
	}
}