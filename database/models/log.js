module.exports = function ({ sequelize, Sequelize }) {
    let Log = sequelize.define('log', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            unique: true
        },
        message: {
            type: Sequelize.STRING
        },

        info: {
            type: Sequelize.STRING(1234)
        },
        type: {
            type: Sequelize.ENUM,
            values: ['LOGIN', 'ERROR', 'BLOCK', 'PAUSE', 'TOKEN']
        },
        timelog: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    })
    return Log;
}