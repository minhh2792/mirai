module.exports = function ({ Sequelize, sequelize }) {
    const force = process.env.NODE_ENV == 'development';
    const user = require("./models/user")({ sequelize, Sequelize }),
        thread = require("./models/thread")({ sequelize, Sequelize }),
        log = require("./models/log")({ sequelize, Sequelize });
    user.sync({force});
    thread.sync({force});
    log.sync({force});
    return {
        model: {
            user,
            thread,
            log
        },
        use: function (modelName) {
            return this.model[`${modelName}`];
        }
    }

}
