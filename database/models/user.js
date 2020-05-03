module.exports = function ({ sequelize, Sequelize }) {
	let User = sequelize.define('user', {
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		uid: {
			type: Sequelize.BIGINT,
			unique: true
		},
		point: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		info: {
			type: Sequelize.JSON
		},
		block: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		},
		economy: {
			type: Sequelize.BIGINT,
			defaultValue: 0
		},
		dailytime: {
			type: Sequelize.BIGINT,
			unique: true
		},
		worktime: {
			type: Sequelize.BIGINT,
			unique: true
		},
	});
	return User;
}