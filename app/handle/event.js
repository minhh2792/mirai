module.exports = function ({ api, modules, config, __GLOBAL }) {
    return function ({ event }) {
        switch (event.logMessageType) {
            case "log:subscribe":
                let addedUserInfo = event.logMessageData.addedParticipants[0];

                if (addedUserInfo.userFbId == api.getCurrentUserID()) {

                    api.sendMessage("Đã kết nối thành công \n Sumi-chan đang lắng nghe mọi người chỉ bảo", event.threadID);
                    api.changeNickname(config.botName, event.threadID, api.getCurrentUserID(), (err) => {
                        if (err) return modules.log(err, 2);
                    });
                }

                break;
            case "log:unsubscribe":

                let leftUserID = event.logMessageData.leftParticipantFbId;
                let authorUserID = event.author;

                if (config.admins.includes(leftUserID)) {

                    api.addUserToGroup(leftUserID, event.threadID, (error) => {

                        if (error) return modules.log(error, 2)
                    });
                    if (leftUserID == authorUserID) return api.sendMessage({ body: "Đừng bỏ em mà huhu :(" }, event.threadID);
                    api.sendMessage({
                        body: "Đừng làm thế ! Anh ấy là người tốt",
                    }, event.threadID);
                }
                break;
            case "log:thread-icon":
                break;
            case "log:user-nickname":
                break;
            case "log:thread-color":
                break;
        }
    }
}
