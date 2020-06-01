const logger = require("../modules/log.js");
module.exports = function ({ models, api }) {
	const User = models.use('user');

	function getUsers(where = {}) {
		return User.findAll({ where }).then(e => e.map(e => e.get({ plain: true }))).catch((error) => {
			logger(error, 2);
			return [];
		})
	}

	function findUser(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return false;
		});
	}

	function createUser(id, joinIn = false, threadid = null) {
		api.getUserInfo(id, (err, result) => {
			if (err) return logger(err, 2);
			const info = result[id];
			User.findOrCreate({ where: { uid: id }, defaults: { info } }).then(([user, created]) => {
				if (created) {
					logger(id, 'New User')
					if (joinIn == true && threadid != null) {
						return getName(id).then(name => {
							api.sendMessage({
								body: "Chào mừng thằng rác rưởi " + name + " đã vào group",
								mentions: [
									{
										tag: name,
										id: id
									}
								]
							}, threadid)
						})
					}
				}
			}).catch((error) => logger(error, 2))
		})
	}

	function unban(uid, block = false) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function (user) {
			if (!user) return;
			return user.update({ block });
		}).then(function () {
			return true;
		}).catch(function (error) {
			logger(error, 2);
			return false;
		})
	}

	function getName(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).info.name;
		});
	}

	function getGender(uid) {
		return User.findOne({
			where: {
				uid
			}
		}).then(function(user) {
			if (!user) return;
			return user.get({ plain: true }).info.gender;
		});
	}

	function ban(uid) {
		return unban(uid, true);
	}

	return {
		getUsers,
		getGender,
		createUser,
		ban,
		unban,
		getName,
		findUser
	}
}
