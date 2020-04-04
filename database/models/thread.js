module.exports = function ({ sequelize, Sequelize }) {
    let Thread = sequelize.define('thread', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        threadID: {
            type: Sequelize.BIGINT,
            unique: true
        },
        block: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    })
    return Thread;
}