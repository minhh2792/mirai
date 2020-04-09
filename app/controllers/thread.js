const logger = require("../modules/log.js");
module.exports = function ({ models, api }) {
    const Thread = models.use('thread');
    function getThreads(where = {}) {
        return Thread.findAll({ where })
            .then(e => e.map(e => e.get({ plain: true })))
            .catch((error) => {
                logger(error, 2);
                return [];
            })
    }
    function createThread(threadID) {
        Thread.findOrCreate({ where: { threadID }, defaults: {} })
            .then(([user, created]) => {
                if (created) return logger(threadID, 'New Thread');
            })
            .catch((error) => {
                logger(error, 2);
            })
    }
    function unban(threadID, block = false) {
        return Thread.findOne({
            where: {
                threadID
            }
        })
            .then(function (thread) {
                if (!thread) return;
                return thread.update({
                    block
                });
            })
            .then(function () {
                return true;
            })
            .catch(function (error) {
                logger(error, 2);
                return false;
            })
    }
    function ban(threadID) {
        return unban(threadID, true);
    }
    return {
        getThreads,
        createThread,
        ban,
        unban
    }
}
