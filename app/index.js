const modules = require("./modules");
const config = require("../config");
module.exports = function ({ api, models, __GLOBAL }) {
    const User = require("./controllers/user")({ models, api });
    const Thread = require("./controllers/thread")({ models, api });
    const Rank = require("./controllers/rank")({ models, api });
    (async function init() {
        modules.log('Khởi tạo biến môi trường.');
        modules.sendAttachment = require("./modules/sendAttachment")({ api })
        __GLOBAL.userBlocked = (await User.getUsers({ block: true })).map(e => e.uid)
        __GLOBAL.threadBlocked = (await Thread.getThreads({ block: true })).map(e => e.threadID)
        modules.log('Khởi tạo biến môi trường xong.');
    })();
    const handleMessage = require("./handle/message")({ api, modules, config, __GLOBAL, User, Thread, Rank });
    const handleEvent = require("./handle/event")({ api, modules, config, __GLOBAL });
    const handleMessageReaction = require("./handle/message_reaction")({ api, modules, config, __GLOBAL, User, Thread });
    modules.log(config.prefix || '<none>', '[ prefix ]');
    modules.log(`${api.getCurrentUserID()} - ${config.botName}`, '[ UID ]');
    modules.log('Bắt đầu listen!');
    return function (error, event) {
        if (error) return modules.log(error, 2);
        // console.log(__GLOBAL);
        // console.log(event);
        switch (event.type) {
            case 'message':
                handleMessage({ event })
                break;
            case 'event':
                handleEvent({ event })
                break;
            case 'message_reaction':
                handleMessageReaction({ event })
                break;
            default:
                return;
                break;
        }

        User.createUser(event.senderID);
        Thread.createThread(event.threadID);
    }
}
