const logger = require("../modules/log.js");
module.exports = function ({ models, api }) {
    const User = models.use('user');
    function getUsers(where = {}) {
        return User.findAll({ where })
            .then(e => e.map(e => e.get({ plain: true })))
            .catch((error) => {
                logger(error, 2);
                return [];
            })
    }
    function createUser(id) {
        api.getUserInfo(id, (err, result) => {
            if (err) return logger(err, 2);
            const info = JSON.stringify(result[id]);
            User.findOrCreate({ where: { uid: id }, defaults: { info } })
                .then(([user, created]) => {
                    if (created) return logger(id, 'New User');
                })
                .catch((error) => {
                    logger(error, 2);
                })
        })
    }
    function unban(uid, block = false) {
        return User.findOne({
            where: {
                uid
            }
        }).then(function (user) {
            if (!user) return;
            return user.update({
                block
            });
        }).then(function () {
            return true;
        }).catch(function (error) {
            logger(error, 2);
            return false;
        })
    }

    function ban(uid) {
        return unban(uid, true);
    }
    return {
        getUsers,
        createUser,
        ban,
        unban
    }
}
