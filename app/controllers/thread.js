const logger = require("../modules/log.js");
module.exports = function ({ models, api }) {
	const Thread = models.use('thread');

	function getThreads(where = {}) {
		return Thread.findAll({ where }).then(e => e.map(e => e.get({ plain: true }))).catch((error) => {
			logger(error, 2);
			return [];
		})
	}

	function createThread(threadID) {
		api.getThreadInfo(threadID, (err, info) => {
			if (err) return logger(err, 2);
			var name = info.name;
			Thread.findOrCreate({ where: { threadID }, defaults: { name } }).then(([thread, created]) => {
				if (created) return logger(threadID, 'New Thread');
			}).catch((error) => {
				logger(error, 2);
			})
		})
	}

	function getName(threadID) {
		return Thread.findOne({
			where: {
				threadID
			}
		}).then(function(thread) {
			if (!thread) return;
			return thread.get({ plain: true }).name;
		});
	}

	function changeName(threadID, name) {
		return Thread.findOne({
			where: {
				threadID
			}
		}).then(function(thread) {
			if (!thread) return;
			return thread.update({ name });
		});
	}

	function unban(threadID, block = false) {
		return Thread.findOne({
			where: {
				threadID
			}
		}).then(function (thread) {
			if (!thread) return;
			return thread.update({ block });
		}).then(function () {
			return true;
		}).catch(function (error) {
			logger(error, 2);
			return false;
		})
	}

	function ban(threadID) {
		return unban(threadID, true);
	}

	function offResend(threadID, block = false) {
		return Thread.findOne({
			where: {
				threadID
			}
		}).then(function (thread) {
			if (!thread) return;
			return thread.update({ blockResend });
		}).then(function () {
			return true;
		}).catch(function (error) {
			logger(error, 2);
			return false;
		})
	}

	function onResend(threadID) {
		return offResend(threadID, true);
	}

	return {
		getThreads,
		createThread,
		getName,
		changeName,
		ban,
		unban,
		offResend,
		onResend
	}
}
