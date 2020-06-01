module.exports = function({ api, modules, config, __GLOBAL, User, Thread, Rank, economy }) {
	/* ================ Config ==================== */
	let {prefix, googleSearch, wolfarm, yandex, openweather, tenor, saucenao, admins, ENDPOINT} = config;
	const fs = require("fs");
	const moment = require("moment-timezone");
	const request = require("request");
	const ms = require("parse-ms");
	const stringSimilarity = require('string-similarity');

	/* ================ CronJob ==================== */

	if (!fs.existsSync(__dirname + "/src/listCommands.json")) {
		var template = [];
		fs.writeFile(__dirname + "/src/listCommand.json", JSON.stringify(template), "utf-8", err => {
			if (err) throw err;
			modules.log("Tạo file listCommand mới thành công!");
		});
	}

	if (!fs.existsSync(__dirname + "/src/groupID.json")) {
		var data = [];
		api.getThreadList(100, null, ["INBOX"], function(err, list) {
			if (err) throw err;
			list.forEach(item => {
				if (item.isGroup == true) data.push(item.threadID);
			});
			fs.writeFile(__dirname + "/src/groupID.json", JSON.stringify(data), err => {
				if (err) throw err;
				modules.log("Tạo file groupID mới thành công!");
			});
		});
	}
	else {
		fs.readFile(__dirname + "/src/groupID.json", "utf-8", (err, data) => {
			if (err) throw err;
			var groupids = JSON.parse(data);
			if (!fs.existsSync(__dirname + "/src/listThread.json")) {
				var firstJSON = {
					wake: [],
					sleep: [],
					fact: []
				};
				fs.writeFileSync(__dirname + "/src/listThread.json", JSON.stringify(firstJSON));
				modules.log("Tạo file listThread mới thành công!");
			}
			setInterval(() => {
				var oldData = JSON.parse(fs.readFileSync(__dirname + "/src/listThread.json"));
				var timer = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm");
				groupids.forEach(item => {
					//chúc đi ngủ
					while (timer == "23:00" && !oldData.sleep.includes(item)) {
						api.sendMessage(`Tới giờ ngủ rồi đấy nii-chan, おやすみなさい!`, item);
						oldData.sleep.push(item);
						break;
					}

					//chào buổi sáng
					while (timer == "07:00" && !oldData.wake.includes(item)) {
						api.sendMessage(`おはようございま các nii-chan uwu`, item);
						oldData.wake.push(item);
						break;
					}

					//những sự thật mỗi ngày
					while (timer == "08:00" && !oldData.fact.includes(item)) {
						oldData.fact.push(item);
						request("https://random-word-api.herokuapp.com/word?number=1", (err, response, body) => {
							if (err) throw err;
							const randomfacts = require("@dpmcmlxxvi/randomfacts");
							var retrieve = JSON.parse(body);
							const fact = randomfacts.make(retrieve);
							api.sendMessage('📖 Fact của ngày hôm nay:\n "' + fact + '".', item);
						});
						break;
					}
					fs.writeFileSync(__dirname + "/src/listThread.json", JSON.stringify(oldData));
				});
				if (timer == "08:05") fs.unlinkSync(__dirname + "/src/listThread.json");
			}, 1000);
		});
	}

	if (!fs.existsSync(__dirname + "/src/quotes.json")) {
		request("https://type.fit/api/quotes", (err, response, body) => {
			if (err) throw err;
			var bodyReplace = body.replace("\n", "");
			fs.writeFile(__dirname + "/src/quotes.json", bodyReplace, "utf-8", (err) => {
				if (err) throw err;
				modules.log("Tạo file quotes mới thành công!");
			});
		});
	}

	return function({ event }) {
		let { body: contentMessage, senderID, threadID, messageID } = event;
		senderID = parseInt(senderID);
		threadID = parseInt(threadID);
		messageID = messageID.toString();

		if (__GLOBAL.userBlocked.includes(senderID)) return;

		User.createUser(senderID);
		Thread.createThread(threadID);

		__GLOBAL.unsend.push({
			msgID: messageID,
			msgBody: contentMessage
		});

		function sleep(milliseconds) {
			const date = Date.now();
			let currentDate = null;
			do {
				currentDate = Date.now();
			} while (currentDate - date < milliseconds);
		}

		/* ================ Staff Commands ==================== */

		//lấy file cmds
		var nocmdFile = fs.readFileSync(__dirname + "/src/cmds.json");
		var nocmdData = JSON.parse(nocmdFile);

		//tạo 1 đối tượng mới nếu group chưa có trong file cmds
		if (!nocmdData.banned.some(item => item.id == threadID)) {
			let addThread = {
				id: threadID,
				cmds: []
			};
			nocmdData.banned.push(addThread);
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(nocmdData));
		}

		//lấy lệnh bị cấm trong group
		var cmds = nocmdData.banned.find(item => item.id == threadID).cmds;
		for (const item of cmds) {
			if (contentMessage.indexOf(prefix + item) == 0) return api.sendMessage("Lệnh này đã bị cấm!", threadID);
		}

		//unban command
		if (contentMessage.indexOf(`${prefix}unban command`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 14,contentMessage.length);
			if (!content) return api.sendMessage("Hãy nhập lệnh cần bỏ cấm!", threadID);
			var jsonData = JSON.parse(fs.readFileSync(__dirname + "/src/cmds.json"));
			var getCMDS = jsonData.banned.find(item => item.id == threadID).cmds;
			if (!getCMDS.includes(content)) return api.sendMessage("Lệnh " + content + " chưa bị cấm", threadID);
			else {
				let getIndex = getCMDS.indexOf(content);
				getCMDS.splice(getIndex, 1);
				api.sendMessage("Đã bỏ cấm " + content + " trong group này", threadID);
			}
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(jsonData), "utf-8");
			return;
		}

		//ban command
		if (contentMessage.indexOf(`${prefix}ban command`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 12, contentMessage.length);
			if (!content) return api.sendMessage("Hãy nhập lệnh cần cấm!", threadID);
			var jsonData = JSON.parse(fs.readFileSync(__dirname + "/src/cmds.json"));
			if (!jsonData.cmds.includes(content)) return api.sendMessage("Không có lệnh " + content + " trong cmds.json nên không thể cấm",threadID);
			else {
				if (jsonData.banned.some(item => item.id == threadID)) {
					let getThread = jsonData.banned.find(item => item.id == threadID);
					getThread.cmds.push(content);
				}
				else {
					let addThread = {
						id: threadID,
						cmds: []
					};
					addThread.cmds.push(content);
					jsonData.banned.push(addThread);
				}
				api.sendMessage("Đã cấm " + content + " trong group này", threadID);
			}
			fs.writeFileSync(__dirname + "/src/cmds.json", JSON.stringify(jsonData), "utf-8");
			return;
		}

		// Unban thread
		if (__GLOBAL.threadBlocked.includes(threadID)) {
			if (contentMessage == `${prefix}unban thread` && admins.includes(senderID)) {
				const indexOfThread = __GLOBAL.threadBlocked.indexOf(threadID);
				if (indexOfThread == -1) return api.sendMessage("Nhóm này chưa bị chặn!", threadID);
				Thread.unban(threadID).then(success => {
					if (!success) return api.sendMessage("Không thể bỏ chặn nhóm này!", threadID);
					api.sendMessage("Nhóm này đã được bỏ chặn!", threadID);
					__GLOBAL.threadBlocked.splice(indexOfThread, 1);
					modules.log(threadID, "Unban Thread");
				});
			}
			return;
		}

		Rank.updatePoint(senderID, 2);

		// Unban user
		if (contentMessage.indexOf(`${prefix}unban`) == 0 && admins.includes(senderID)) {
			const mentions = Object.keys(event.mentions);
			if (!mentions) return api.sendMessage("Vui lòng tag những người cần unban", threadID);
			mentions.forEach(mention => {
				const indexOfUser = __GLOBAL.userBlocked.indexOf(parseInt(mention));
				if (indexOfUser == -1)
					return api.sendMessage(
						{
							body: `${event.mentions[mention]} chưa bị ban, vui lòng ban trước!`,
							mentions: [
								{
									tag: event.mentions[mention],
									id: mention
								}
							]
						},
						threadID
					);
				User.unban(mention).then(success => {
					if (!success) return api.sendMessage("Không thể unban người này!", threadID);
					api.sendMessage(
						{
							body: `Đã unban ${event.mentions[mention]}!`,
							mentions: [
								{
									tag: event.mentions[mention],
									id: mention
								}
							]
						},
						threadID
					);
					__GLOBAL.userBlocked.splice(indexOfUser, 1);
					modules.log(mentions, "Unban User");
				});
			});
			return;
		}

		// Ban thread
		if (contentMessage == `${prefix}ban thread` && admins.includes(senderID)) {
			Thread.ban(parseInt(threadID)).then((success) => {
				if (!success) return api.sendMessage("Không thể ban group này!", threadID);
				api.sendMessage("Nhóm này đã bị chặn tin nhắn!.", threadID);
				__GLOBAL.threadBlocked.push(parseInt(threadID));
			})
			return;
		}

		//on resend
		if (contentMessage == `${prefix}resend off`) {
			Thread.offResend(parseInt(threadID)).then((success) => {
				if (!success) return api.sendMessage("Oops, không thể tắt resend ở nhóm này!", threadID);
				api.sendMessage("Đã tắt resend tin nhắn thành công!", threadID);
				__GLOBAL.threadBlockedResend.push(parseInt(threadID));
			})
			return;
		}

		//off resend
		if (__GLOBAL.threadBlockedResend.includes(threadID)) {
			if (contentMessage == `${prefix}resend on`) {
				const indexOfThread = __GLOBAL.threadBlockResend.indexOf(threadID);
				if (indexOfThread == -1) return api.sendMessage("Nhóm này chưa tắt resend 🤔", threadID);
				Thread.onResend(threadID).then(success => {
					if (!success) return api.sendMessage("Oops, không thể bật resend ở nhóm này!", threadID);
					api.sendMessage("Đã bật resend tin nhắn, bạn xoá tôi sẽ nhắc lại tin nhắn bạn đã xoá 😈", threadID);
					__GLOBAL.threadBlockedResend.splice(indexOfThread, 1);
				});
			}
			return;
		}

		// Ban user
		if (contentMessage.indexOf(`${prefix}ban`) == 0 && admins.includes(senderID)) {
			const mentions = Object.keys(event.mentions);
			if (!mentions) return api.sendMessage("Vui lòng tag những người cần ban!", threadID);
			mentions.forEach(mention => {
				User.ban(parseInt(mention)).then((success) => {
					if (!success) return api.sendMessage("Không thể ban người này!", threadID);
					api.sendMessage({
						body: `${event.mentions[mention]} đã bị ban!`,
						mentions: [
							{
								tag: event.mentions[mention],
								id: parseInt(mention)
							}
						]
					}, threadID);
					__GLOBAL.userBlocked.push(parseInt(mention));
					modules.log(parseInt(mention), 'Ban User');
				})
			});
			return;
		}

		//Thông báo tới toàn bộ group!
		if (contentMessage.indexOf(`${prefix}noti`) == 0 && admins.includes(senderID)) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (!content) return api.sendMessage("Nhập thông tin vào!", threadID, messageID);
			api.getThreadList(100, null, ["INBOX"], function(err, list) {
				if (err) throw err;
				list.forEach(item => {
					if (item.isGroup == true && item.threadID != threadID) api.sendMessage(content, item.threadID);
					modules.log("gửi thông báo mới thành công!");
				});
			});
			return;
		}

		//giúp thành viên thông báo lỗi về admin
		if (contentMessage.indexOf(`${prefix}report`) == 0) {
			var content = contentMessage.slice(prefix.length + 7, contentMessage.length);
			if (!content) return api.sendMessage("Có vẻ như bạn chưa nhập thông tin, vui lòng nhập thông tin lỗi mà bạn gặp!", threadID, messageID);
			(async () => {
				var userName = await User.getName(senderID)
				var threadName = await Thread.getName(threadID)
				api.sendMessage(
					"Báo cáo từ: " + userName +
					"\nGroup gặp lỗi: " + threadName +
					"\nLỗi gặp phải: " + content +
					"\nThời gian báo: " + moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss"),
					admins[0]
				)
			})()
			return api.sendMessage("Thông tin lỗi của bạn đã được gửi về admin!", threadID, messageID);
		}
		
		//restart
		if (contentMessage == `${prefix}restart` && admins.includes(senderID)) return api.sendMessage(`Hệ thống restart khẩn ngay bây giờ!!`, threadID, () =>  require("node-cmd").run("pm2 restart 0") , messageID);

		/* ==================== Help Commands ================*/

		//add thêm lệnh cho help
		if (contentMessage.indexOf(`${prefix}sethelp`) == 0 && admins.includes(senderID)) {
			var string = contentMessage.slice(prefix.length + 8, contentMessage.length); //name | decs | usage | example | group
			if (string.length == 0) return api.sendMessage("error: content Not Found!", threadID, messageID);

			let stringIndexOf = string.indexOf(" | ");
			let name = string.slice(0, stringIndexOf); //name
			let center = string.slice(stringIndexOf + 1, string.length); //decs | usage | example | group

			let stringIndexOf2 = center.indexOf(" | ");
			let decs = center.slice(0, stringIndexOf2); //decs
			let stringNext = center.slice(stringIndexOf2 + 1, center.length); //usage | example | group

			let stringIndexOf3 = stringNext.indexOf(" | ");
			let usage = stringNext.slice(0, stringIndexOf3); //usage
			let stringNext2 = stringNext.slice(stringIndexOf3 + 1, stringNext.length); //example | group

			let stringIndexOf4 = stringNext2.indexOf(" | ");
			let example = stringNext2.slice(0, stringIndexOf4); //example
			let group = stringNext2.slice(stringIndexOf4 + 1, stringNext2.length); //group

			var oldDataJSON = JSON.parse(fs.readFileSync(__dirname + "/src/listCommands.json"));
			var pushJSON = {
				name: name,
				decs: decs,
				usage: usage,
				example: example,
				group: group
			};
			oldDataJSON.push(pushJSON);
			fs.writeFileSync(__dirname + "/src/listCommands.json", JSON.stringify(oldDataJSON));
			return api.sendMessage("Đã ghi xong!", threadID, messageID);
		}

		//delete lệnh trong help
		if (contentMessage.indexOf(`${prefix}delhelp`) == 0 && admins.includes(senderID)) {
			var string = contentMessage.slice(prefix.length + 8, contentMessage.length);
			var oldDataJSON = JSON.parse(fs.readFileSync(__dirname + "/src/listCommands.json"));
			const index = oldDataJSON.findIndex(x => x.name === string);
			if (index !== undefined) oldDataJSON.splice(index, 1);
			fs.writeFile(__dirname + "/src/listCommands.json", JSON.stringify(oldDataJSON));
			return api.sendMessage("Xóa lệnh hoàn tất!", threadID, messageID);
		}

		//gethelp
		if (contentMessage.indexOf(`${prefix}help`) == 0) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var helpList = JSON.parse(fs.readFileSync(__dirname + "/src/listCommands.json"));
			if (content.length == 0) {
				var helpGroup = [];
				var helpMsg = "";
				helpList.forEach(help => {
					if (!helpGroup.some(item => item.group == help.group)) {
						helpGroup.push({
							group: help.group,
							cmds: [help.name]
						});
					}
					else {
						var getHelp = helpGroup.find(item => item.group == help.group);
						getHelp.cmds.push(help.name);
					}
				});
				helpGroup.forEach(help => {
					let helpCmds = help.cmds.join(', ');
					helpMsg += `===== ${help.group.charAt(0).toUpperCase() + help.group.slice(1)} =====\n${helpCmds}\n\n`
				});
				return api.sendMessage(helpMsg, threadID, messageID);
			}
			else {
				if (helpList.some(item => item.name == content)) {
					return api.sendMessage(
						'=== Thông tin lệnh bạn đang tìm ===\n' +
						'- Tên lệnh: ' + helpList.find(item => item.name == content).name + '\n' +
						'- Thông tin: ' + helpList.find(item => item.name == content).decs + '\n' +
						'- Sử dụng: ' + prefix + helpList.find(item => item.name == content).usage + '\n' +
						'- Hướng dẫn: ' + prefix + helpList.find(item => item.name == content).example + '\n' +
						'- Thuộc loại: ' + helpList.find(item => item.name == content).group,
						threadID, messageID
					);
				}
				else {
					var helpGroup = [];
					var helpMsg = "";
					helpList.forEach(help => {
						if (!helpGroup.some(item => item.group == help.group)) {
							helpGroup.push({
								group: help.group,
								cmds: [help.name]
							});
						}
						else {
							var getHelp = helpGroup.find(item => item.group == help.group);
							getHelp.cmds.push(help.name);
						}
					});
					helpGroup.forEach(help => {
						let helpCmds = help.cmds.join(', ');
						helpMsg += `*** Lệnh không hợp lệ, đây là danh sách các lệnh ***\n===== ${help.group.charAt(0).toUpperCase() + help.group.slice(1)} =====\n${helpCmds}\n\n `
					});
					return api.sendMessage(helpMsg, threadID, messageID);
				}
			}
		}

		//yêu cầu công việc cho bot
		if (contentMessage.indexOf(`${prefix}request`) == 0) {
			var content = contentMessage.slice(prefix.length + 8,contentMessage.length);
			if (!fs.existsSync(__dirname + "/src/requestList.json")) {
				let requestList = [];
				fs.writeFileSync(__dirname + "/src/requestList.json",JSON.stringify(requestList));
			}
			if (content.indexOf("add") == 0) {
				var addnew = content.slice(4, content.length);
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				getData.push(addnew);
				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(getData));
				return api.sendMessage("Đã thêm '" + addnew + "' vào request list", threadID, () => {
					api.sendMessage("ID " + senderID + " Đã thêm '" + addnew + "' vào request list", admins[0]);
				}, messageID);
			}
			else if (content.indexOf("del") == 0 && admins.includes(senderID)) {
				var deletethisthing = content.slice(4, content.length);
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				if (getData.length == 0) return api.sendMessage("Không tìm thấy " + deletethisthing, threadID, messageID);
				var itemIndex = getData.indexOf(deletethisthing);
				getData.splice(itemIndex, 1);
				fs.writeFileSync(__dirname + "/src/requestList.json", JSON.stringify(getData));
				return api.sendMessage("Đã xóa: " + deletethisthing, threadID, messageID);
			}
			else if (content.indexOf("list") == 0) {
				var getList = fs.readFileSync(__dirname + "/src/requestList.json");
				var getData = JSON.parse(getList);
				if (getData.length == 0) return api.sendMessage("Không có việc cần làm", threadID, messageID);
				let allWorks = "";
				getData.map(item => {
					allWorks = allWorks + `\n- ` + item;
				});
				return api.sendMessage("Đây là toàn bộ yêu cầu mà các bạn đã gửi:" + allWorks, threadID, messageID);
			}
		}

		/* ==================== General Commands ================*/

		if (contentMessage.indexOf(`${prefix}anime`) == 0) {
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			var jsonData = fs.readFileSync(__dirname + "/src/anime.json");
			var data = JSON.parse(jsonData);

			var url;
			if (data.sfw.hasOwnProperty(content)) url = data.sfw[content];
			else if (data.nsfw.hasOwnProperty(content)) url = data.nsfw[content];
			else if (!content || !data.nsfw.hasOwnProperty(content) || !data.sfw.hasOwnProperty(content)) {
				let sfwList = [];
				let nsfwList = [];
				Object.keys(data.sfw).forEach(endpoint => {
					sfwList.push(endpoint);
				});
				Object.keys(data.nsfw).forEach(endpoint => {
					nsfwList.push(endpoint);
				});
				var sfwTags = sfwList.join(', ');
				var nsfwTags = nsfwList.join(', ');
				return api.sendMessage(`=== Tất cả các tag SFW ===\n` + sfwTags + `\n\n=== Tất cả các tag NSFW ===\n` + nsfwTags, threadID, messageID);
			}

			return request(url, (error, response, body) => {
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let callback = function() {
					api.sendMessage({
						body: "",
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});
		}

		//meme
		if (contentMessage == `${prefix}meme`)
			return request("https://meme-api.herokuapp.com/gimme/memes", (err, response, body) => {
				if (err) throw err;
				var content = JSON.parse(body);
				let title = content.title;
				var baseurl = content.url;
				let callback = function() {
					api.sendMessage({
						body: `${title}`,
						attachment: fs.createReadStream(__dirname + "/src/meme.jpg")
					}, threadID, () => fs.unlinkSync(__dirname + "/src/meme.jpg"), messageID);
				};
				request(baseurl).pipe(fs.createWriteStream(__dirname + `/src/meme.jpg`)).on("close", callback);
			});

		if (contentMessage.indexOf(`${prefix}gif`) == 0) {
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			if (content.length == -1) return api.sendMessage(`Bạn đã nhập sai format, vui lòng ${prefix}help gif để biết thêm chi tiết!`, threadID, messageID);
			if (content.indexOf(`cat`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=cat&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					console.log(stringURL);
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + `/src/randompic.gif`)
						}, threadID, () => fs.unlinkSync(__dirname + `/src/randompic.gif`));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + `/src/randompic.gif`)).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`dog`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=dog&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`capoo`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=capoo&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`mixi`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=mixigaming&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}

			else if (content.indexOf(`bomman`) !== -1) {
				request(`https://api.tenor.com/v1/random?key=${tenor}&q=bommanrage&limit=1`, (err, response, body) => {
					if (err) throw err;
					var string = JSON.parse(body);
					var stringURL = string.results[0].media[0].tinygif.url;
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/randompic.gif")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/randompic.gif"));
					};
					request(stringURL).pipe(fs.createWriteStream(__dirname + "/src/randompic.gif")).on("close", callback);
				});
				return;
			}
			else return api.sendMessage(`Tag của bạn nhập không tồn tại, vui lòng đọc hướng dẫn sử dụng trong ${prefix}help gif`, threadID, messageID);
		}

		if (contentMessage.indexOf(`${prefix}hug`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/hug', (err, response, body) =>{
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 5, contentMessage.length).replace("@", "");
				let callback = function() {
					api.sendMessage({
						body: tag + ", i wanna hug you ❤️",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		if (contentMessage.indexOf(`${prefix}kiss`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/kiss', (err, response, body) =>{
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 6, contentMessage.length).replace("@", "");
				let callback = function() {
					api.sendMessage({
						body: tag + ", i wanna kiss you ❤️",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		if (contentMessage.indexOf(`${prefix}slap`) == 0 && contentMessage.indexOf('@') !== -1)
			return request('https://nekos.life/api/v2/img/slap', (err, response, body) =>{
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf(".") + 1);
				let tag = contentMessage.slice(prefix.length + 5, contentMessage.length).replace("@", "");
				let callback = function() {
					api.sendMessage({
						body: tag + ", take this slap 😈",
						mentions: [
							{
								tag: tag,
								id: Object.keys(event.mentions)[0]
							}
						],
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					}, threadID, () => fs.unlinkSync(__dirname + `/src/anime.${ext}`), messageID);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on("close", callback);
			});

		//saucenao
		if (contentMessage.indexOf(`${prefix}saucenao`) == 0) {
			if (event.type != "message_reply") return api.sendMessage(`vui lòng bạn reply bức ảnh cần phải tìm!`, threadID, messageID);
			var BaseJson = event.messageReply.attachments;
			if (event.messageReply.attachments.length > 1) return api.sendMessage(`vui lòng reply một ảnh thay gì nhiều ảnh!`, threadID, messageID);
			if (event.messageReply.attachments[0].type == 'photo') {
				if (saucenao == '' || saucenao == undefined) return api.sendMessage(`Chưa có api của saucenao!!`, threadID, messageID);
				var imgURL = event.messageReply.attachments[0].url;
				const sagiri = require('sagiri'),
				search = new sagiri(saucenao, {
					numRes: 1
				});

				search.getSauce(imgURL).then(response => {
					let data = response[0];
					let results = {
						thumbnail: data.original.header.thumbnail,
						similarity: data.similarity,
						material: data.original.data.material || 'none',
						characters: data.original.data.characters || 'none',
						creator: data.original.data.creator || 'none',
						site: data.site,
						url: data.url
					};
					const minSimilarity = 30;
					if (minSimilarity <= ~~results.similarity) {
						api.sendMessage(
						'Đây là kết quả tìm kiếm được\n' +
						'-------------------------\n' +
						'- Độ tương tự: ' + results.similarity + '%\n' +
						'- Material: ' + results.material + '\n' +
						'- Characters: ' + results.characters + '\n' +
						'- Creator: ' + results.creator + '\n' +
						'- Original site: ' + results.site + ' - ' + results.url, threadID, messageID);
					} else {
						api.sendMessage(`chà thấy kết quả nào trùng với ảnh bạn đang tìm kiếm :'(`, threadID, messageID);
					}
				});
			}
			return;
		}


		/* ==================== General Commands ================ */

		//gọi bot
		if (contentMessage == `${prefix}sumi` || contentMessage.indexOf('sumi') == 0) return api.sendMessage(`Dạ gọi Sumi ạ?`, threadID, messageID);

		//lenny
		if (contentMessage == `${prefix}lenny` || contentMessage.indexOf('lenny') == 0) return api.sendMessage("( ͡° ͜ʖ ͡°) ", threadID, messageID);

		//mlem
		if (contentMessage == `${prefix}mlem` || contentMessage.indexOf('mlem') == 0) return api.sendMessage(" ( ͡°👅 ͡°)  ", threadID, messageID);

		//care
		if (contentMessage == `${prefix}care` || contentMessage.indexOf('care') == 0) return api.sendMessage("¯\\_(ツ)_/¯", threadID, messageID);

		//prefix
		if (contentMessage.indexOf(`prefix`) == 0) return api.sendMessage(`Prefix is: ${prefix}`, threadID, messageID);

		//credits
		if (contentMessage.indexOf("credits") == 0) return api.sendMessage("Project Sumi-chan-bot được thực hiện bởi:\nSpermLord: https://www.facebook.com/MyNameIsSpermLord\nCatalizCS: https://www.facebook.com/Cataliz2k\nFull source code at: https://github.com/roxtigger2003/Sumi-chan-bot", threadID, messageID);

		//simsimi
		if (contentMessage.indexOf(`${prefix}sim`) == 0) {
			const fetch = require('node-fetch');
			var content = contentMessage.slice(1, contentMessage.length);
			const params = new URLSearchParams();
			params.set('lang', 'vi');
			params.set('hoi', content);
			if (!content) return api.sendMessage("Nhập tin nhắn!", threadID, messageID);
			fetch("https://sim.vnoi.xyz/post_simsimi.php", {
				method: "post",
				body: params.toString(),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Content-Length": params.toString().length,
					Origin: "https://sim.vnoi.xyz",
					Referer: "https://sim.vnoi.xyz/?lang=vi",
				}
			}).then(async (res) => {
				if (res.status != 200) return api.sendMessage("Đã có lỗi xảy ra!", threadID, messageID)
				var msg = await res.json();
				if (msg.error && msg.error != -1) return api.sendMessage("Đã có lỗi xảy ra", threadID, messageID)
				api.sendMessage(msg.message, threadID, messageID)
			});
			return;
		}

		if (contentMessage == `${prefix}randomcolor`) {
			var color = ['196241301102133','169463077092846','2442142322678320', '234137870477637', '980963458735625','175615189761153','2136751179887052', '2058653964378557','2129984390566328','174636906462322','1928399724138152','417639218648241','930060997172551','164535220883264','370940413392601','205488546921017','809305022860427'];
			return api.changeThreadColor(color[Math.floor(Math.random() * color.length)], threadID, (err) => {
				if (err) return api.sendMessage('Đã có lỗi không mong muốn đã xảy ra', threadID, messageID);
			});
		}

		//poll
		if (contentMessage.indexOf(`${prefix}poll`) == 0) {
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var title = content.slice(0, content.indexOf(" -> "));
			var options = content.substring(content.indexOf(" -> ") + 4)
			var option = options.split(" | ");
			var object = {}
			for (var i = 0; i < option.length; i++) {
				object[option[i]] = false;
			}
			api.createPoll(title, threadID, object, (err) => {
				if(err) return api.sendMessage("Có lỗi xảy ra vui lòng thử lại", threadID, messageID);
			});
		}

		if (contentMessage.indexOf(`${prefix}rainbow`) == 0) {
			var value = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (isNaN(value)) return api.sendMessage('dữ liệu không phải là một con số', threadID, messageID);
			if (value > 50) return api.sendMessage('dữ liệu phải nhỏ hơn 50!', threadID, messageID);
			var color = ['196241301102133','169463077092846','2442142322678320', '234137870477637', '980963458735625','175615189761153','2136751179887052', '2058653964378557','2129984390566328','174636906462322','1928399724138152','417639218648241','930060997172551','164535220883264','370940413392601','205488546921017','809305022860427'];
			for (var i = 0; i < value; i++) {
				api.changeThreadColor(color[Math.floor(Math.random() * color.length)], threadID, (err) => sleep(1000));
			};
			return;
		}

		//giveaway
		if (contentMessage.indexOf(`${prefix}giveaway`) == 0) {
			var content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			api.getThreadInfo(threadID, function(err, info) {
				if (err) return api.sendMessage(`đã xảy ra lỗi không mong muốn`, threadID, messageID);
				let winner = info.participantIDs[Math.floor(Math.random() * info.participantIDs.length)];
				User.getName(winner).then((name) => {
					if (err) return api.sendMessage(`đã xảy ra lỗi không mong muốn`, threadID, messageID);
					api.sendMessage({
						body: `yahoo ${name}, bạn đã thắng giveaway! phần thưởng là: ${content}🥳🥳.`,
						mentions: [
							{
								tag: name,
								id: winner
							}
						]
					}, threadID, messageID);
				});
			});
			return;
		}

		//thời tiết
		if (contentMessage.indexOf(`${prefix}weather`) == 0) {
			var city = contentMessage.slice(prefix.length + 8, contentMessage.length);
			if (city.length == 0) return api.sendMessage(`Bạn chưa nhập địa điểm, hãy đọc hướng dẫn tại ${prefix}help weather !`,threadID, messageID);
			request(encodeURI("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + openweather + "&units=metric&lang=vi"), (err, response, body) => {
				if (err) throw err;
				var weatherData = JSON.parse(body);
				if (weatherData.cod !== 200) return api.sendMessage(`Thành phố ${city} không tồn tại!`, threadID, messageID);
				api.sendMessage(
					'🌡 Nhiệt độ: ' + weatherData.main.temp + '°C' + '\n' +
					'☁️ Mây: ' + weatherData.weather[0].description + '\n' +
					'💦 Độ ẩm: ' + weatherData.main.humidity + '%' + '\n' +
					'💨 Tốc độ gió: ' + weatherData.wind.speed + 'km/h',
					threadID, messageID
				);
			});
			return;
		}

		//say
		if (contentMessage.indexOf(`${prefix}say`) == 0) {
			const tts = require("./modules/say");
			var content = contentMessage.slice(prefix.length + 4,contentMessage.length);
			let callback = function() {
				api.sendMessage({
					body: "",
					attachment: fs.createReadStream(__dirname + "/src/say.mp3")
				}, threadID, () => fs.unlinkSync(__dirname + "/src/say.mp3"));
			};
			if (contentMessage.indexOf("jp") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length),"ja",callback);
			else if (contentMessage.indexOf("en") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.length),"en-US",callback);
			else if (contentMessage.indexOf("ko") == 5) tts.other(contentMessage.slice(prefix.length + 7, contentMessage.lenght),"ko",callback);
			else if (contentMessage.indexOf("ru") == 5) tts.other(contentMessage.slice(prefix.lenght + 7, contentMessage.lenght),"ru",callback);
			else tts.vn(content, callback);
			return;
		}

		//cập nhật tình hình dịch
		if (contentMessage == `${prefix}covid-19`)
			return request("https://code.junookyo.xyz/api/ncov-moh/data.json", (err, response, body) => {
				if (err) throw err;
				var data = JSON.parse(body);
				api.sendMessage(
					"Thế giới:" +
					"\n- Nhiễm: " + data.data.global.cases +
					"\n- Chết: " + data.data.global.deaths +
					"\n- Hồi phục: " + data.data.global.recovered +
					"\nViệt Nam:" +
					"\n- Nhiễm: " + data.data.vietnam.cases +
					"\n- Chết: " + data.data.vietnam.deaths +
					"\n- Phục hồi: " + data.data.vietnam.recovered,
					threadID,
					messageID
				);
			});

		//chọn
		if (contentMessage.indexOf(`${prefix}choose`) == 0) {
			var input = contentMessage.slice(prefix.length + 7, contentMessage.length).trim();
			if (!input)return api.sendMessage(`Bạn không nhập đủ thông tin kìa :(`,threadID,messageID);
			var array = input.split(" | ");
			return api.sendMessage(`hmmmm, em sẽ chọn giúp cho là: ` + array[Math.floor(Math.random() * array.length)] + `.`,threadID,messageID);
		}

		//waifu
		if (contentMessage === `${prefix}waifu`) {
			var route = Math.round(Math.random() * 10);
			if (route == 1 || route == 0) {
				api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
				api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
				return;
			}
			else if (route == 2) return api.sendMessage("Làm Bạn thôi nhé :'(", threadID, messageID);
			else if (route == 3) {
				api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID, messageID);
				api.sendMessage("Yêu chàng nhiều <3", threadID, messageID);
				return;
			}
			else if (route > 4) {
				api.sendMessage("-.-", threadID, messageID);
				api.sendMessage("Chúng ta chỉ là bạn thôi :'(", threadID, messageID);
				return;
			}
		}

		//ramdom con số
		if (contentMessage == `${prefix}roll`) return api.sendMessage("UwU Your Number is " + Math.round(Math.random() * 100), threadID, messageID);

		//Khiến bot nhái lại tin nhắn bạn
		if (contentMessage.indexOf(`${prefix}echo`) == 0) return api.sendMessage(contentMessage.slice(prefix.length + 5, contentMessage.length), threadID);

		//rank
		if (contentMessage.indexOf(`${prefix}rank`) == 0) {
			const createCard = require("../controllers/rank_card");
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (content.length == 0) {
				(async () => {
					let name = await User.getName(senderID)
					Rank.getPoint(senderID).then(point => createCard({ id: senderID, name, ...point })).then(path => {
						api.sendMessage(
							{
								body: "",
								attachment: fs.createReadStream(path)
							},
							threadID, () => fs.unlinkSync(path), messageID
						)
					})
				})()
			}
			else if (content.indexOf("@") !== -1) {
				for (var i = 0; i < Object.keys(event.mentions).length; i++) {
					let uid = Object.keys(event.mentions)[i];
					(async () => {
						let name = await User.getName(uid)
						Rank.getPoint(uid).then(point => createCard({ id: uid, name, ...point })).then(path => {
							api.sendMessage(
								{
									body: "",
									attachment: fs.createReadStream(path)
								},
								threadID, () => fs.unlinkSync(path), messageID
							)
						})
					})()
				}
			}
			return;
		}

		//dịch ngôn ngữ
		if (contentMessage.indexOf(`${prefix}trans`) == 0) {
			var content = contentMessage.slice(prefix.length + 6, contentMessage.length);
			if (content.length == 0 && event.type != "message_reply") return api.sendMessage(`Bạn chưa nhập thông tin, vui lòng đọc ${prefix}help để biết thêm chi tiết!`, threadID,messageID);
			var translateThis = content.slice(0, content.indexOf(" ->"));
			var lang = content.substring(content.indexOf(" -> ") + 4);
			if (event.type == "message_reply") {
				translateThis = event.messageReply.body
				if (content.indexOf(" -> ") != -1) lang = content.substring(content.indexOf(" -> ") + 4);
				else lang = 'vi'
			}
			else if (content.indexOf(" -> ") == -1) {
				translateThis = content.slice(0, content.length)
				lang = 'vi'
			}
			return request(encodeURI(`https://translate.yandex.net/api/v1.5/tr.json/translate?key=${yandex}&text=${translateThis}&lang=${lang}`), (err, response, body) => {
				if (err) return api.sendMessage("Server đã xảy ra vấn đề, vui lòng báo lại cho admin!!!", threadID, messageID)
				var retrieve = JSON.parse(body);
				var convert = retrieve.text[0];
				var splitLang = retrieve.lang.split("-");
				var fromLang = splitLang[0];
				api.sendMessage(
					`Bản dịch: ${convert}\n` +
					`${fromLang} -> ${lang}`,
					threadID, messageID
				);
			});
		}

		//châm ngôn sống
		if (contentMessage == `${prefix}quotes`) {
			var stringData = JSON.parse(fs.readFileSync(__dirname + "/src/quotes.json"));
			var randomQuotes = stringData[Math.floor(Math.random() * stringData.length)];
			return api.sendMessage('Quote: \n "' + randomQuotes.text + '"\n     -' + randomQuotes.author + "-", threadID, messageID);
		}

		//khiến bot làm toán ?!
		if (contentMessage.indexOf(`${prefix}math`) == 0) {
			const wolfram = "http://api.wolframalpha.com/v2/result?appid=" + wolfarm + "&i=";
			var m = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var o = m.replace(/ /g, "+");
			var l = "http://lmgtfy.com/?q=" + o;
			request(wolfram + encodeURIComponent(m), function(err, response, body) {
				if (body.toString() === "Wolfram|Alpha did not understand your input") return api.sendMessage(l, threadID, messageID);
				else if (body.toString() === "Wolfram|Alpha did not understand your input") return api.sendMessage("I don't understand your question :3", threadID, messageID);
				else if (body.toString() === "My name is Wolfram Alpha.") return api.sendMessage("My name is Sumi-chan.", threadID, messageID);
				else if (body.toString() === "I was created by Stephen Wolfram and his team.") return api.sendMessage("I Was Created by Catalizcs, I love him too <3", threadID, messageID);
				else if (body.toString() === "I am not programmed to respond to this dialect of English.") return api.sendMessage("Tôi không được lập trình để nói những thứ vô học như này\n:)", threadID, messageID);
				else if (body.toString() === "StringJoin(CalculateParse`Content`Calculate`InternetData(Automatic, Name))") return api.sendMessage("I don't know how to answer this question", threadID, messageID);
				else return api.sendMessage(body, threadID, messageID);
			});
		}

		//uptime
		if (contentMessage == `${prefix}uptime`) {
			var time = process.uptime();
			var minutes = Math.floor((time % (60 * 60)) / 60);
			var seconds = Math.floor(time % 60);
			api.sendMessage(
				"Bot đã hoạt động được " +
				minutes + " phút " +
				seconds + " giây." +
				"\nLưu ý: Bot sẽ tự động restart sau khi 10 phút hoạt động!",
				threadID, messageID
			);
			return;
		}

		//unsend message
		if (contentMessage.indexOf(`${prefix}gỡ`) == 0) {
			if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage("Không thể gỡ tin nhắn của người khác", threadID, messageID);
			if (event.type != "message_reply") return api.sendMessage("Phản hồi tin nhắn cần gỡ", threadID, messageID);
			return api.unsendMessage(event.messageReply.messageID, err => {
				if (err) api.sendMessage("Không thể gỡ tin nhắn này vì đã quá 10 phút!", threadID, messageID);
			});
		}

		//get uid
		if (contentMessage.indexOf(`${prefix}uid`) == 0) {
			var content = contentMessage.slice(prefix.length + 4, contentMessage.length);
			if (!content) return api.sendMessage(`${senderID}`, threadID, messageID);
			else if (content.indexOf("@") !== -1) {
				for (var i = 0; i < Object.keys(event.mentions).length; i++) {
					api.sendMessage(`${Object.keys(event.mentions)[i]}`, threadID, messageID);
				}
				return;
			}
		}

		//wiki
		if (contentMessage.indexOf(`${prefix}wiki`) == 0) {
			const wiki = require("wikijs").default;
			var url = 'https://vi.wikipedia.org/w/api.php';
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			if (contentMessage.indexOf("-en") == 6) {
				url = 'https://en.wikipedia.org/w/api.php';
				content = contentMessage.slice(prefix.length + 9, contentMessage.length);
			}
			if (!content) return api.sendMessage("Nhập thứ cần tìm!", threadID, messageID);
			wiki({apiUrl: url}).page(content).catch((err) => api.sendMessage("Không tìm thấy " + content, threadID, messageID)).then(page => {
				if (typeof page == 'undefined') return;
				Promise.resolve(page.summary()).then(val => api.sendMessage(val, threadID, messageID));
			});
			return;
		}

		//ping
		if (contentMessage == `${prefix}ping`)
			return api.getThreadInfo(threadID, function(err, info) {
				if (err) throw err;
				let ids = info.participantIDs;
				let botid = api.getCurrentUserID();
				let callid = {
					body: "Ping🏓",
					mentions: [
						{
							tag: `${botid}`,
							id: botid
						}
					]
				};
				ids.forEach(getid => {
					if (id != botid) {
						var addthis = {
							tag: `${id}`,
							id: id
						}
						callid["mentions"].push(addthis);
					}
				});
				api.sendMessage(callid, threadID, messageID);
			});

			//look earth
			if (contentMessage.indexOf(`${prefix}earth`) == 0)
				return request(`https://api.nasa.gov/EPIC/api/natural/images?api_key=DEMO_KEY`, (err, response, body) => {
					if (err) throw err;
					var jsonData = JSON.parse(body);
					var randomNumber = Math.floor(Math.random() * ((jsonData.length -1) + 1));
					var image_name = jsonData[randomNumber].image
					var date = jsonData[randomNumber].date;
					var date_split = date.split("-")
					var year = date_split[0];
					var month = date_split[1];
					var day_and_time = date_split[2];
					var sliced_date = day_and_time.slice(0, 2);
					var image_link = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${sliced_date}/png/` + image_name + ".png";
					let callback = function() {
						api.sendMessage({
							body: `${jsonData[randomNumber].caption} on ${date}`,
							attachment: fs.createReadStream(__dirname + `/src/randompic.png`)
						}, threadID, () => fs.unlinkSync(__dirname + `/src/randompic.png`), messageID);
					};
					request(image_link).pipe(fs.createWriteStream(__dirname + `/src/randompic.png`)).on("close", callback);
				});

			//localtion iss
			if (contentMessage.indexOf(`${prefix}iss`) == 0) {
				request (`http://api.open-notify.org/iss-now.json`, (err, response, body) => {
					if (err) throw err;
					var jsonData = JSON.parse(body);
					var position = jsonData["iss_position"];
					var latitude = position["latitude"];
					var longitude = position["longitude"];
					var iss_output = `Vĩ độ: ${latitude} Kinh độ: ${longitude}`
					api.sendMessage(`Vị trí hiện tại của International Space Station 🌌🌠🌃 \n` + iss_output, threadID, messageID);
				});
			}

			//near-earth obj
			if (contentMessage.indexOf(`${prefix}neo`) == 0) {
				return request (`https://api.nasa.gov/neo/rest/v1/feed/today?detailed=true&api_key=DEMO_KEY`, (err, response, body) => {
					if (err) throw err;
					var jsonData = JSON.parse(body);
					var total = jsonData.element_count;
					api.sendMessage(` Hiện tại đang có tổng cộng: ` + total + ` vật thể đang ở gần trái đất ngay lúc này!!`, threadID, messageID);
				});
			}

			//acronym
			if (contentMessage.indexOf(`${prefix}acronym`) == 0) {
				var content = contentMessage.slice(prefix.length + 8, contentMessage.length);
				if (!content) return api.sendMessage(`bạn chưa thêm từ viết tắt cần tìm kiếm!`, threadID, messageID);
				var acronym_uri = `http://acronyms.silmaril.ie/cgi-bin/xaa?${content}`;
				var acronym_meanings = [];
				return request(acronym_uri, { json: true }, (err, res, body) => {
					if (err) throw err;
					var split_body = body.split("\n");
					var num_acronyms = split_body[4];
					if (num_acronyms.includes("0")) api.sendMessage("không tìm thấy từ viết tắt này trong từ điển.", threadID, messageID)
					else {
						var header = "```ml" + "\n" + "Acronym Meanings for " + content + "👀 \n" + "```"
						for (var i = 6; i < split_body.length - 1; i += 4) {
							var line = split_body[i]
							line = line.trim()
							var split_acr_array = line.split(" ");
							var first_item = split_acr_array[0]
							if (split_acr_array.length === 1) {
								first_item = first_item.slice(7, first_item.length - 8)
								split_acr_array[0] = first_item
							}
							else {
								var strpd_item = first_item.slice(7, first_item.length + 5);
								split_acr_array[0] = strpd_item;
								var last_item = split_acr_array[split_acr_array.length - 1];
								var strpd_last_item = last_item.slice(0, split_acr_array.length - 11);
								split_acr_array[split_acr_array.length - 1] = strpd_last_item;
							}
							var final_acronym = split_acr_array.toString()
							final_acronym = final_acronym.split(",").join(" ")
							acronym_meanings.push(final_acronym)
						}
						api.sendMessage(`Nghĩa của từ viết tắt '${content}' là:\n ` + acronym_meanings.join("\n - ") + `.`, threadID, messageID);
					};
				});
			}

		//count
		if (contentMessage.indexOf(`${prefix}count`) == 0)
			return api.getThreadInfo(threadID, (err, info) => api.sendMessage("Tổng tin nhắn trong group này là: " + info.messageCount, threadID, messageID));

		/* ==================== NSFW Commands ==================== */

		//nhentai ramdom code
		if (contentMessage == `${prefix}nhentai -r`) return api.sendMessage(`Code lý tưởng của nii-chan là: ${Math.floor(Math.random() * 99999)}`, threadID, messageID);

		//nhentai search
		if (contentMessage.indexOf(`${prefix}nhentai -i`) == 0) {
			let id = contentMessage.slice(prefix.length + 11, contentMessage.length).trim();
			if (!id) return api.sendMessage("Nhập id!", threadID, messageID);
			return request(`https://nhentai.net/api/gallery/${id}`, (error, response, body) => {
				var codeData = JSON.parse(body);
				if (codeData.error == true) return api.sendMessage("Không tìm thấy truyện này", threadID, messageID);
				let title = codeData.title.pretty;
				let tagList = [];
				let artistList = [];
				let characterList = [];
				codeData.tags.forEach(item => {
					if (item.type == "tag") tagList.push(item.name);
					else if (item.type == "artist") artistList.push(item.name);
					else if (item.type == 'character') characterList.push(item.name);
				});
				var tags = tagList.join(', ');
				var artists = artistList.join(', ');
				var characters = characterList.join(', ');
				if (characters == '') characters = 'Original';
				return api.sendMessage("Tiêu đề: " + title, threadID, () => {
					api.sendMessage("Tác giả: " + artists, threadID, () => {
						api.sendMessage("Nhân vật: " + characters, threadID, () => {
							api.sendMessage("Tags: " + tags, threadID, () => {
								api.sendMessage("Link: https://nhentai.net/g/" + id, threadID);
							});
						});
					});
				}, messageID);
			});
		}

		//hentaivn
		if (contentMessage.indexOf(`${prefix}hentaivn -i`) == 0) {
			const cheerio = require('cheerio');
			const axios = require('axios');
			var id = contentMessage.slice(prefix.length + 12, contentMessage.length);
			if (!id) return api.sendMessage("Nhập id!", threadID, messageID);
			axios.get(`https://hentaivn.net/id${id}`).then((response) => {
				if (response.status == 200) {
					const html = response.data;
					const $ = cheerio.load(html);
					var getContainer = $('div.container');
					var getURL = getContainer.find('form').attr('action');
					if (getURL == `https://hentaivn.net/${id}-doc-truyen-.html`) return api.sendMessage("Không tìm thấy truyện này", threadID, messageID);
					axios.get(getURL).then((response) => {
						if (response.status == 200) {
							const html = response.data;
							const $ = cheerio.load(html);
							var getInfo = $('div.container div.main div.page-info');
							var getUpload = $('div.container div.main div.page-uploader');
							var getName = getInfo.find('h1').find('a').text();
							var getTags = getInfo.find('a.tag').contents().map(function() {
								return (this.type === 'text') ? $(this).text() + '' : '';
							}).get().join(', ');
							var getArtist = getInfo.find('a[href^="/tacgia="]').contents().map(function () {
								return (this.type === 'text') ? $(this).text() + '' : '';
							}).get().join(', ');
							var getChar = getInfo.find('a[href^="/char="]').contents().map(function () {
								return (this.type === 'text') ? $(this).text() + '' : '';
							}).get().join(', ');
							if (getChar == '') getChar = 'Original';
							var getLikes = getUpload.find('div.but_like').text();
							var getDislikes = getUpload.find('div.but_unlike').text();
							return api.sendMessage("Tên: " + getName.substring(1), threadID, () => {
								api.sendMessage("Tác giả: " + getArtist, threadID, () => {
									api.sendMessage("Nhân vật: " + getChar, threadID, () => {
										api.sendMessage("Tags: " + getTags, threadID, () => {
											api.sendMessage("Số Like: " + getLikes.substring(1) + "\nSố Dislike: " + getDislikes.substring(1), threadID, () => {
												api.sendMessage(getURL.slice(0, 17) + " " + getURL.slice(17), threadID);
											});
										});
									});
								});
							}, messageID);
						}
					}, (error) => console.log(error));
				}
			}, (error) => console.log(error));
			return;
		}

		//porn pics
		if (contentMessage.indexOf(`${prefix}porn`) == 0) {
			const cheerio = require('cheerio');
			const axios = require('axios');
			const ffmpeg = require("fluent-ffmpeg");
			const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
			ffmpeg.setFfmpegPath(ffmpegPath);
			var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
			var album = {
				'boobs': "15467902",
				'cum': "1036491",
				'bj': "28207541",
				'feet': "852341",
				'ass': "2830292",
				'sex': "29916621",
				'pussy': "2192882",
				'teen': "21506052",
				'bdsm': "17510771",
				'asian': "9057591",
				'pornstar': "20404671",
				'gay': "19446301"
			};
			if (!content || !album.hasOwnProperty(content)) {
				let allTags = [];
				Object.keys(album).forEach((item) => {
					allTags.push(item);
				});
				var pornTags = allTags.join(', ');
				return api.sendMessage("Tất cả tag là:\n" + pornTags, threadID, messageID);
			}
			axios.get(`https://www.pornhub.com/album/${album[content]}`).then((response) => {
				if (response.status == 200) {
					const html = response.data;
					const $ = cheerio.load(html);
					var result = [];
					let list = $('ul.photosAlbumsListing li.photoAlbumListContainer div.photoAlbumListBlock');
					list.map(idx => {
						let item = list.eq(idx);
						if (!item.length) return;
						let photo = `${item.find('a').attr('href')}`;
						result.push(photo);
					});
					let getURL = "https://www.pornhub.com" + result[Math.floor(Math.random() * result.length)];
					axios.get(getURL).then((response) => {
						if (response.status == 200) {
							const html = response.data;
							const $ = cheerio.load(html);
							if (content == 'sex') {
								let video = $('video.centerImageVid');
								let mp4URL = video.find('source').attr('src');
								let ext = mp4URL.substring(mp4URL.lastIndexOf('.') + 1);
								request(mp4URL).pipe(fs.createWriteStream(__dirname + `/src/porn.${ext}`)).on('close', () => {
									ffmpeg().input(__dirname + `/src/porn.${ext}`).toFormat("gif").pipe(fs.createWriteStream(__dirname + "/src/porn.gif")).on("close", () => {
										return api.sendMessage(={
											body: "",
											attachment: fs.createReadStream(__dirname + `/src/porn.gif`)
										}, threadID, () => {
											fs.unlinkSync(__dirname + `/src/porn.gif`);
											fs.unlinkSync(__dirname + `/src/porn.${ext}`);
										}, messageID);
									});
								});
							}
							else {
								let image = $('div#photoWrapper');
								let imgURL = image.find('img').attr('src');
								let ext = imgURL.substring(imgURL.lastIndexOf('.') + 1);
								request(imgURL).pipe(fs.createWriteStream(__dirname + `/src/porn.${ext}`)).on('close', () => {
									return api.sendMessage({
										body: "",
										attachment: fs.createReadStream(__dirname + `/src/porn.${ext}`)
									}, threadID, () => fs.unlinkSync(__dirname + `/src/porn.${ext}`), messageID);
								});
							}
						}
					}, (error) => console.log(error));
				}
				else return api.sendMessage("Đã xảy ra lỗi!", threadID, messageID);
			}, (error) => console.log(error));
			return;
		}
		
		/* ==================== Economy and Minigame Commands ==================== */

		//coinflip
		if (contentMessage.indexOf(`${prefix}coinflip`) == 0) {
			if (Math.floor(Math.random() * Math.floor(2)) === 0) return api.sendMessage("Mặt ngửa!", threadID, messageID);
			else return api.sendMessage("Mặt sấp!", threadID, messageID);
		}

		//balance
		if (contentMessage.indexOf(`${prefix}kẹt ngân`) == 0) {
			var content = contentMessage.slice(prefix.length + 8, contentMessage.length);
			var mention = Object.keys(event.mentions)[0];
			if (!content)
				return economy.getMoney(senderID).then((moneydb) => api.sendMessage(`Số tiền của bạn hiện đang có là: ${moneydb} đô`, threadID, messageID));
			else if (content.indexOf("@") !== -1)
				return economy.getMoney(mention).then(function(moneydb) {
					api.sendMessage(
						{
							body: `Số tiền của ${event.mentions[mention].replace("@", "")} hiện đang có là: ${moneydb} đô.`,
							mentions: [
								{
									tag: event.mentions[mention].replace("@", ""),
									id: mention
								}
							]
						},
						threadID,
						messageID
					);
				});
		}

		if (contentMessage.indexOf(`${prefix}daily`) == 0) {
			let cooldown = 8.64e7; //86400000
			economy.getDailyTime(senderID).then(function(lastDaily) {
				if (lastDaily !== null && cooldown - (Date.now() - lastDaily) > 0) {
					let time = ms(cooldown - (Date.now() - lastDaily));
					api.sendMessage(
						"Bạn đã nhận phần thưởng của ngày hôm nay, vui lòng quay lại sau: " +
						time.hours + " giờ " +
						time.minutes + " phút " +
						time.seconds + " giây ",
						threadID, messageID
					);
				}
				else {
					api.sendMessage(
						"Bạn đã nhận phần thưởng của ngày hôm nay. Cố gắng lên nhé <3",
						threadID,
						() => {
							economy.updateMoney(senderID, 200);
							economy.updateDailyTime(senderID, Date.now());
							modules.log("User: " + senderID + " nhận daily thành công!");
						},
						messageID
					);
				}
			});
			return;
		}

		if (contentMessage == `${prefix}thăm ngàn`) {
			let cooldown = 1200000;
			economy.getWorkTime(senderID).then(function(lastWork) {
				if (lastWork !== null && cooldown - (Date.now() - lastWork) > 0) {
					let time = ms(cooldown - (Date.now() - lastWork));
					api.sendMessage(
						"Bạn đã thăm ngàn, để tránh bị kiệt sức vui lòng quay lại sau:" +
						time.minutes + " phút " +
						time.seconds + " giây ",
						threadID,
						messageID
					);
				}
				else {
					let job = [
						"bán vé số",
						"sửa xe",
						"lập trình",
						"hack facebook",
						"thợ sửa ống nước ( ͡° ͜ʖ ͡°)",
						"đầu bếp",
						"thợ hồ",
						"fake taxi",
						"gangbang người khác",
						"re sờ chym mờ",
						"bán hàng online",
						"nội trợ",
						"vả mấy thằng sao đỏ, giun vàng",
						"bán hoa",
						"tìm jav/hentai code cho SpermLord"
					];
					let result = Math.floor(Math.random() * job.length);
					let amount = Math.floor(Math.random() * 400);
					api.sendMessage(
						"Bạn đã làm công việc " + job[result] +
						" và đã nhận được số tiền là: " + amount + " đô",
						threadID,
						() => {
							economy.updateMoney(senderID, amount);
							economy.updateWorkTime(senderID, Date.now());
							modules.log("User: " + senderID + " nhận job thành công!");
						},
						messageID
					);
				}
			});
			return;
		}

		if (contentMessage.indexOf(`${prefix}roul`) == 0) {
			economy.getMoney(senderID).then(function(moneydb) {
				var content = contentMessage.slice(prefix.length + 5, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn chưa nhập thông tin đặt cược!`, threadID, messageID);
				var string = content.split(" ");
				var color = string[0];
				var money = string[1];
				var moneyWin = "";
				function isOdd(num) {
					if (num % 2 == 0) return false;
					else if (num % 2 == 1) return true;
				}
				let random = Math.floor(Math.random() * 37);
				if (isNaN(money)|| money.indexOf("-") !== -1) return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại ${prefix}help roul`, threadID, messageID);
				if (!money || !color) return api.sendMessage("Sai format", threadID, messageID);
				if (money > moneydb) return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 50) return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 50 đô!`, threadID, messageID);
				if (color == "b" || color.includes("black")) color = 0;
				else if (color == "r" || color.includes("red")) color = 1;
				else if (color == "g" || color.includes("green")) color = 2;
				else return api.sendMessage("Bạn chưa nhập thông tin cá cược!, red [1.5x] black [2x] green [15x]", threadID, messageID);
				if (random == 0) api.sendMessage("Màu 💚", threadID, messageID);
				else if (isOdd(random)) api.sendMessage("Màu ❤️", threadID, messageID);
				else if (!isOdd(random)) api.sendMessage("Màu 🖤", threadID, messageID);
				if (random == 0 && color == 2) {
					money *= 15;
					api.sendMessage(`Bạn đã chọn màu 💚, bạn đã thắng với số tiền được nhân lên 15: ${money *= 15} đô || số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on green`);
				}
				else if (isOdd(random) && color == 1) {
					money = parseInt(money * 1.5);
					api.sendMessage(`Bạn đã chọn màu ❤️, bạn đã thắng với số tiền nhân lên 1.5: ${money} đô || số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on red`);
				}
				else if (!isOdd(random) && color == 0) {
					money = parseInt(money * 2);
					api.sendMessage(`Bạn đã chọn màu 🖤️, bạn đã thắng với số tiền nhân lên 2: ${money} đô || || số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => economy.updateMoney(senderID, money), messageID);
					modules.log(`${senderID} Won ${money} on black`);
				}
				else api.sendMessage(`Bạn đã ra đê ở và mất trắng số tiền: ${money} đô :'( || số tiền hiện tại bạn có: ${moneydb}`, threadID, () => economy.subtractMoney(senderID, money), messageID);
			});
			return;
		}

		//slot
		if (contentMessage.indexOf(`${prefix}sl`) == 0) {
			const slotItems = ["🍇", "🍉", "🍊", "🍏", "7⃣", "🍓", "🍒"];
			economy.getMoney(senderID).then(function(moneydb) {
				var content = contentMessage.slice(prefix.length + 3, contentMessage.length);
				if (!content) return api.sendMessage(`Bạn chưa nhập thông tin đặt cược!`, threadID, messageID);
				var string = content.split(" ");
				var money = string[0];
				let win = false;
				if (isNaN(money)|| money.indexOf("-") !== -1)
					return api.sendMessage(`Số tiền đặt cược của bạn không phải là một con số, vui lòng xem lại cách sử dụng tại !help sl`, threadID, messageID);
				if (!money)
					return api.sendMessage("Chưa nhập số tiền đặt cược!", threadID, messageID);
				if (money > moneydb)
					return api.sendMessage(`Số tiền của bạn không đủ`, threadID, messageID);
				if (money < 50) 
					return api.sendMessage(`Số tiền đặt cược của bạn quá nhỏ, tối thiểu là 50 đô!`, threadID, messageID);

				let number = [];
				for (i = 0; i < 3; i++) {
					number[i] = Math.floor(Math.random() * slotItems.length);
				}

				if (number[0] == number[1] && number[1] == number[2]) {
					money *= 9;
					win = true;
				}
				else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
					money *= 2;
					win = true;
				}

				if (win) {
					api.sendMessage(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]} \n\nBạn đã thắng, toàn bộ ${money} đô thuộc về bạn || số tiền hiện tại bạn có: ${moneydb + money}`, threadID, () => economy.updateMoney(senderID, money), messageID);
				}
				else {
					api.sendMessage(`${slotItems[number[0]]} | ${slotItems[number[1]]} | ${slotItems[number[2]]} \n\nBạn đã thua, toàn bộ ${money} đô bay vào không trung xD || số tiền hiện tại bạn có: ${moneydb - money}`, threadID, () => economy.subtractMoney(senderID, money), messageID);
				}
			});
			return;
		}

		//pay command
		if (contentMessage.indexOf(`${prefix}pay`) == 0) {
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 4,contentMessage.length);
			var moneyPay = content.substring(content.lastIndexOf(" ") + 1);
			economy.getMoney(senderID).then((moneydb) => {
				if (!moneyPay) return api.sendMessage("bạn chưa nhập số tiền cần chuyển!", threadID, messageID);
				if (isNaN(moneyPay) || moneyPay.indexOf("-") !== -1) return api.sendMessage(`số tiền bạn nhập không hợp lệ, vui lòng xem lại cách sử dụng tại ${prefix}help pay`, threadID, messageID);
				if (moneyPay > moneydb) return api.sendMessage('Số tiền mặt trong người bạn không đủ, vui lòng kiểm tra lại số tiền bạn đang có!', threadID, messageID);
				if (moneyPay < 50) return api.sendMessage(`Số tiền cần chuyển của bạn quá nhỏ, tối thiểu là 50 đô!`, threadID, messageID);
				api.sendMessage(
					{
						body: `Bạn đã chuyển ${moneyPay} đô cho ${event.mentions[mention].replace("@", "")}.`,
						mentions: [
							{
								tag: event.mentions[mention].replace("@", ""),
								id: mention
							}
						]
					},
					threadID,
					() => {
						economy.updateMoney(mention, parseInt(moneyPay));
						economy.subtractMoney(senderID, parseInt(moneyPay));
					},
					messageID
				);
			});
			return;
		}

		//setmoney command
		if (contentMessage.indexOf(`${prefix}setmoney`) == 0 && admins.includes(senderID)) {
			var mention = Object.keys(event.mentions)[0];
			var content = contentMessage.slice(prefix.length + 9,contentMessage.length);
			var sender = content.slice(0, content.lastIndexOf(" "));
			var moneyPay = content.substring(content.lastIndexOf(" ") + 1);
			economy.getMoney(senderID).then((moneydb) => {
				if (isNaN(moneyPay)) return api.sendMessage('số tiền cần set của bạn không phải là 1 con số!!', threadID, messageID);
				if (moneydb == undefined) return api.sendMessage('user cần set chưa tồn tại trên hệ thống dữ liệu!', threadID, messageID);
				if (!mention && sender == 'me') return api.sendMessage("Đã sửa tiền của bản thân thành " + moneyPay, threadID, () => economy.setMoney(senderID, parseInt(moneyPay)), messageID);
				if (!memtion && isNaN(sender)) return api.sendMessage("Đã sửa tiền của " + sender + " thành " + moneyPay, threadID, () => economy.setMoney(sender, parseInt(moneyPay)), messageID);
				api.sendMessage(
					{
						body: `Bạn đã sửa tiền của ${event.mentions[mention].replace("@", "")} thành ${moneyPay} đô.`,
						mentions: [
							{
								tag: event.mentions[mention].replace("@", ""),
								id: mention
							}
						]
					},
					threadID,
					() => economy.setMoney(mention, parseInt(moneyPay)),
					messageID
				);
			});
			return;
		}

		/* ==================== Media Commands ==================== */

		//get video facebook
		if (contentMessage.indexOf(`${prefix}facebook -p`) == 0) {
			var content = contentMessage.slice(prefix.length + 12, contentMessage.length);
			const media = require("./modules/media");
			if (!content) return api.sendMessage(`Bạn chưa nhập thông tin cần thiết!`, threadID, messageID);
			api.sendMessage("Đợi em một xíu...", threadID, messageID);
			require("fb-video-downloader").getInfo(content).then(info => {
				let gg = JSON.stringify(info, null, 2);
				let data = JSON.parse(gg);
				let callback = function() {
					api.sendMessage({
						body: "",
						attachment: fs.createReadStream(__dirname + "/src/video.mp4")
					}, threadID, () => fs.unlinkSync(__dirname + "/src/video.mp4"));
				};
				media.facebookVideo(data.download.sd, callback);
			});
			return;
		}

		//get video youtube
		if (contentMessage.indexOf(`${prefix}youtube -p`) == 0) {
			const media = require("./modules/media");
			var content = contentMessage.slice(prefix.length + 11, contentMessage.length);
			const ytdl = require("ytdl-core");
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);
			if (content.indexOf('https') == -1 || content.indexOf('http') == -1) {
				request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${googleSearch}&q=${encodeURIComponent(content)}`, (err, response, body) => {
					if (err) return api.sendMessage("Lỗi cmnr :|", threadID, messageID);;
					var retrieve = JSON.parse(body);
					var content = "https://www.youtube.com/watch?v=" + retrieve.items[0].id.videoId;
					var title = retrieve.items[0].snippet.title;
					var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
					let callback = function() {
						api.sendMessage(
							title,
							threadID,
							() => {
								api.sendMessage({
									body: ``,
									attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
								}, threadID, () => {
									fs.unlinkSync(__dirname + "/src/thumbnails.png");
									api.sendMessage(content, threadID, () => getVideo(content));
								});
							}, messageID
						);
					};
					request(thumbnails).pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`)).on("close", callback);
				});
			}
			else getVideo(content);
			function getVideo(content) {
				ytdl.getInfo(content, function(err, info) {
					if (err) return api.sendMessage('Link youtube không hợp lệ!', threadID, messageID);
					if (info.length_seconds > 360) return api.sendMessage("Độ dài video vượt quá mức cho phép, tối thiểu là 6 phút!", threadID, messageID);
					api.sendMessage("Đợi em một xíu em đang xử lý...", threadID, messageID);
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/video.mp4")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/video.mp4"));
					};
					media.youtubeVideo(content, callback);
				});
			};
			return;
		}

		//get audio youtube
		if (contentMessage.indexOf(`${prefix}youtube -m`) == 0) {
			const media = require("./modules/media");
			var content = contentMessage.slice(prefix.length + 11, contentMessage.length);
			const ytdl = require("ytdl-core");
			if (!content) return api.sendMessage("Bạn chưa nhập thông tin cần thiết!", threadID, messageID);
			if (content.indexOf('https') == -1 || content.indexOf('http') == -1) {
				request(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&key=${googleSearch}&q=${encodeURIComponent(content)}`, (err, response, body) => {
					if (err) return api.sendMessage("Lỗi cmnr :|", threadID, messageID);;
					var retrieve = JSON.parse(body);
					var content = "https://www.youtube.com/watch?v=" + retrieve.items[0].id.videoId;
					var title = retrieve.items[0].snippet.title;
					var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
					let callback = function() {
						api.sendMessage(
							title,
							threadID,
							() => {
								api.sendMessage({
									body: ``,
									attachment: fs.createReadStream(__dirname + "/src/thumbnails.png")
								}, threadID, () => {
									fs.unlinkSync(__dirname + "/src/thumbnails.png");
									api.sendMessage(content, threadID, () => getMusic(content));
								});
							},
							messageID
						);
					};
					request(thumbnails).pipe(fs.createWriteStream(__dirname + `/src/thumbnails.png`)).on("close", callback);
				});
			}
			else getMusic(content);
			function getMusic(content) {
				ytdl.getInfo(content, function(err, info) {
					if (err) return api.sendMessage('Link youtube không hợp lệ!', threadID, messageID);
					if (info.length_seconds > 360) return api.sendMessage("Độ dài video vượt quá mức cho phép, tối thiểu là 6 phút!", threadID, messageID);
					api.sendMessage("Đợi em một xíu em đang xử lý...", threadID, messageID);
					let callback = function() {
						api.sendMessage({
							body: "",
							attachment: fs.createReadStream(__dirname + "/src/music.mp3")
						}, threadID, () => fs.unlinkSync(__dirname + "/src/music.mp3"));
					};
					media.youtubeMusic(content, callback);
				});
			};
			return;
		}

		//Check if command is correct
		if (contentMessage.indexOf(prefix) == 0) {
			var findSpace = contentMessage.indexOf(' ');
			var checkCmd;
			if (findSpace == -1) checkCmd = stringSimilarity.findBestMatch(contentMessage.slice(prefix.length, contentMessage.length), nocmdData.cmds);
			else checkCmd = stringSimilarity.findBestMatch(contentMessage.slice(prefix.length, findSpace), nocmdData.cmds);
			if (checkCmd.bestMatch.rating == 0 || checkCmd.bestMatch.rating < 0.3) return;
			return api.sendMessage(`Ý bạn có phải là lệnh "${prefix + checkCmd.bestMatch.target}" này hay không?`, threadID, messageID);
		}
	};
};
/* This bot was made by Catalizcs(roxtigger2003) and SpermLord(spermlord) with love <3, pls dont delete this credits! THANKS very much */