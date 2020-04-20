const fs = require("fs");
const createCard = require("../controllers/rank_card");
const osu = require("node-osu");
const ytdl = require("ytdl-core");
const moment = require("moment-timezone");
const request = require("request");
const http = require("http");
const randomfacts = require("@dpmcmlxxvi/randomfacts");
const api = "https://random-word-api.herokuapp.com/word?number=1";
const wiki = require("wikijs").default;
const facebook = require("facebook-video-downloader");
const cmd = require("node-cmd");
//API GOOGLE//
var youtube =
  "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&key=AIzaSyDq7arcyv1OG694MJxGeikQKmprootf4Qs&q=";
const wolfram =
  "http://api.wolframalpha.com/v2/result?appid=T8J8YV-H265UQ762K&i=";
var osuApi = new osu.Api("f542df9a0b7efc666ac0350446f954740a88faa8", {
  notFoundAsError: true,
  completeScores: false
});
var clock = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
var timer = moment.tz("Asia/Ho_Chi_Minh").format("HH");
//MODULES//
const takedata = require("./modules/corona");
const apilocal = require("./modules/findlocaltion");
const playvideo = require("./modules/playvideo");
const music = require("./modules/music");
const nhentai = require("./modules/nhentai-search");
const tts = require("./modules/say");
const weather = require("./modules/weather");
console.log(clock);

module.exports = function({
  api,
  modules,
  config,
  __GLOBAL,
  User,
  Thread,
  Rank
}) {
  let { prefix, ENDPOINT, admins } = config;
/* ================ CronJob ==================== */
   
  if (!fs.existsSync(__dirname + "/src/listCommands.json")) {
      var template = [];
      push = JSON.stringify(template);
      fs.writeFile(__dirname + "/src/listCommand.json", push, "utf-8", err => {
        if (err) throw err;
        modules.log('System: Tạo file listCommand mới thành công!');
      });
    }
    
    if (!fs.existsSync(__dirname + "/src/quotes.json")) {
      request("https://type.fit/api/quotes", (err, response, body) => {
        if (err) throw err;
        var bodyReplace = body.replace("\n", "");
        fs.writeFile(
          __dirname + "/src/quotes.json",
          bodyReplace,
          "utf-8",
          err => {
            if (err) throw err;
            modules.log('System: Tạo file quotes mới thành công!');
          }
        );
      });
    } 

  fs.readFile(__dirname + "/src/groupID.json", "utf-8", (err, data) => {
    if (err) throw err;
    var groupids = JSON.parse(data);

    if (!fs.existsSync(__dirname + "/src/listThread.json")) {
      var firstJSON = {
        wake: [],
        sleep: [],
        late: [],
        fact: []
      };
      fs.writeFile(
        __dirname + "/src/listThread.json",
        JSON.stringify(firstJSON),
        "utf-8",
        err => {
          if (err) throw err;
          modules.log('System: Tạo file listThread mới thành công!');
        }
      );
    }
    fs.readFile(__dirname + "/src/listThread.json", "utf-8", function(
      err,
      data
    ) {
      if (err) throw err;
      var oldData = JSON.parse(data);
      groupids.forEach(item => {
        while (timer >= 22 && timer <= 23 && !oldData.sleep.includes(item)) {
          api.sendMessage(
            `Tới giờ ngủ rồi đấy nii-chan, おやすみなさい!  `,
            item
          );
          oldData.sleep.push(item);
          break;
        }
        
        //chào buổi sáng
        while (timer >= 6 && timer <= 8 && !oldData.wake.includes(item)) {
          api.sendMessage(` おはようございま các nii-chan uwu `, item);
          oldData.wake.push(item);
          break;
        }
        
        //những sự thật mỗi ngày
        while (timer >= 6 && timer <= 7 && !oldData.fact.includes(item)) {
          oldData.fact.push(item);
          request(
            "https://random-word-api.herokuapp.com/word?number=1",
            (err, response, body) => {
              if (err) throw err;
              var retrieve = JSON.parse(body);
              const fact = randomfacts.make(retrieve);
              api.sendMessage(
                '📖Fact của ngày hôm nay:\n "' + fact + '".',
                item
              );
            }
          );
          break;
        }
        
        //xoá toàn bộ
        if (timer == '00') {
          oldData.wake = [];
          oldData.sleep = [];
          oldData.late = [];
          oldData.fact = [];
        }

        let newData = JSON.stringify(oldData);
        fs.writeFile(
          __dirname + "/src/listThread.json",
          newData,
          "utf-8",
          err => {
            if (err) throw err;
          }
        );
      });
    });
  });
  return function({ event }) {
    let { body: contentMessage, senderID, threadID } = event;
    senderID = parseInt(senderID);
    threadID = parseInt(threadID);

/* ================ Staff Commands ==================== */

    if (__GLOBAL.userBlocked.includes(senderID)) {
      return;
    }
    // Unban thread
    if (__GLOBAL.threadBlocked.includes(threadID)) {
      if (
        contentMessage == `${prefix}unban thread` &&
        admins.includes(senderID)
      ) {
        const indexOfThread = __GLOBAL.threadBlocked.indexOf(threadID);
        if (indexOfThread == -1)
          return api.sendMessage("Nhóm này chưa bị chặn!", threadID);
        Thread.unban(threadID).then(success => {
          if (!success)
            return api.sendMessage("Không thể bỏ chặn nhóm này!", threadID);
          api.sendMessage("Nhóm này đã được bỏ chặn!", threadID);
          //Clear from blocked
          __GLOBAL.threadBlocked.splice(indexOfThread, 1);
          modules.log(threadID, "Unban Thread");
        });

        return;
      }
      return;
    }

    Rank.updatePoint(senderID, 2);

    // Unban user
    if (
      contentMessage.indexOf(`${prefix}unban`) == 0 &&
      admins.includes(senderID)
    ) {
      const mentions = Object.keys(event.mentions);
      if (mentions.length == 0)
        return api.sendMessage("Vui lòng tag những người cần unban", threadID);
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
          if (!success)
            return api.sendMessage("Không thể unban người này!", threadID);
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
          //Clear from blocked
          __GLOBAL.userBlocked.splice(indexOfUser, 1);
          modules.log(mentions, "Unban User");
        });
      });
      return;
    }

    // Ban thread
    if (contentMessage == `${prefix}ban thread` && admins.includes(senderID)) {
      api.sendMessage("Bạn có chắc muốn ban group này ?", threadID, function(
        error,
        info
      ) {
        if (error) return modules.log(error, 2);
        __GLOBAL.confirm.push({
          type: "ban:thread",
          messageID: info.messageID,
          target: parseInt(threadID),
          author: senderID
        });
      });
      return;
    }

    // Ban user
    if (
      contentMessage.indexOf(`${prefix}ban`) == 0 &&
      admins.includes(senderID)
    ) {
      const mentions = Object.keys(event.mentions);
      if (mentions.length == 0)
        return api.sendMessage("Vui lòng tag những người cần ban!", threadID);
      mentions.forEach(mention => {
        if (admins.includes(mention))
          return api.sendMessage(
            "Bạn không đủ thẩm quyền để ban người này?",
            threadID
          );
        api.sendMessage(
          {
            body: `Bạn có chắc muốn ban ${event.mentions[mention]}?`,
            mentions: [
              {
                tag: event.mentions[mention],
                id: mention
              }
            ]
          },
          threadID,
          function(error, info) {
            if (error) return modules.log(error, 2);
            __GLOBAL.confirm.push({
              type: "ban:user",
              messageID: info.messageID,
              target: {
                tag: event.mentions[mention],
                id: parseInt(mention)
              },
              author: senderID
            });
          }
        );
      });
      return;
    }

    //lấy tên group
    if (
      contentMessage.indexOf(`${prefix}getname`) == 0 &&
      admins.includes(senderID)
    ) {
      var content = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Bạn chưa nhập ID thread!", threadID);
      api.getThreadInfo(content, function(err, info) {
        if (err) throw err;
        api.sendMessage(info.name, threadID);
      });
    }

    //Thông báo tới toàn bộ group!
    if (
      contentMessage.indexOf(`${prefix}update`) == 0 &&
      admins.includes(senderID)
    ) {
      var content = contentMessage.slice(
        prefix.length + 7,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Nhập thông tin vào!", threadID);

      api.getThreadList(100, null, ["INBOX"], function(err, list) {
        if (err) throw err;
        list.forEach(item => {
          if (item.isGroup == true) api.sendMessage(content, item.threadID);
          modules.log('gửi thông báo mới thành công!');
        });
      });
      return;
    }
    
    //giúp thành viên thông báo lỗi về admin
    if (contentMessage.indexOf(`${prefix}report`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 7,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(
          " Có vẻ như bạn chưa nhập thông tin, vui lòng nhập thông tin lỗi mà bạn gặp!",
          threadID
        );
      api.sendMessage(
        " Có báo cáo lỗi mới từ id: " +
          senderID +
          "\n - ThreadID gặp lỗi: " +
          threadID +
          "\n - Lỗi gặp phải: " +
          content +
          " \n - lỗi được thông báo vào lúc: " +
          clock,
        admins[0]
      );
      api.sendMessage("Thông tin lỗi của bạn đã được gửi về admin!", threadID);
      return;
    }

    //boost rank
    if (
      contentMessage.indexOf(`${prefix}boostrank`) == 0 &&
      admins.includes(senderID)
    ) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var content = contentMessage
          .slice(prefix.length + 10, contentMessage.length)
          .trim();
        if (content.length == 0)
          return api.sendMessage(`Chưa nhập thông tin kìa bạn eii`, threadID);
        var split = content.split(" ");
        var point = split[2];
        var tag = split[1];
        Rank.updatePoint(Object.keys(event.mentions)[i], point);
        api.sendMessage(
          {
            body: tag + " Đã được boost thêm: " + point + " điểm",
            mentions: [
              {
                tag: tag,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID
        );
        modules.log(Rank.getPoint(Object.keys(event.mentions)[i]));
      }
      return;
    }
    
    //reset điểm
    if (
      contentMessage.indexOf(`${prefix}reset`) == 0 &&
      admins.includes(senderID)
    ) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var content = contentMessage
          .slice(prefix.length + 6, contentMessage.length)
          .trim();
        if (content.length == 0)
          return api.sendMessage(`Chưa nhập thông tin kìa bạn eii`, threadID);
        var split = content.split(" ");
        var tag = split[1];
        Rank.setDefault(Object.keys(event.mentions)[i]);
        api.sendMessage(
          {
            body: tag + " Đã reset điểm",
            mentions: [
              {
                tag: tag,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID
        );
      }
      return;
    }
    
    //ping url
    if (contentMessage.indexOf(`${prefix}ping url`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      );
      if (content.length == 0) return api.sendMessage("ip đâu ?", threadID);
      cmd.get("ping " + content + " -c 1", (err, data, response) =>
        api.sendMessage("Ping Connection: \n" + data, threadID)
      );
      return;
    }

    //get ids
    if (contentMessage == `${prefix}getids` && admins.includes(senderID)) {
      var data = [];
      api.getThreadList(100, null, ["INBOX"], function(err, list) {
        if (err) throw err;
        list.forEach(item => {
          if (item.isGroup == true) {
            data.push(item.threadID);
          }
        });
        console.log(data);
        fs.writeFile(
          __dirname + "/src/groupID.json",
          JSON.stringify(data),
          err => {
            if (err) throw err;
            modules.log('System: Tạo file groupID mới thành công!');
          }
        );
      });
      return;
    }

/* ==================== Help Commands ================*/

    // add thêm lệnh cho help
    if (
      contentMessage.indexOf(`${prefix}sethelp`) == 0 &&
      admins.includes(senderID)
    ) {
      var string = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      ); //name|decs|usage|example|group
      if (string.length == 0)
        return api.sendMessage("error: content Not Found!", threadID);

      stringIndexOf = string.indexOf("|");
      name = string.slice(0, stringIndexOf); //name
      center = string.slice(stringIndexOf + 1, string.length); //decs|usage|example|group

      stringIndexOf2 = center.indexOf("|");
      decs = center.slice(0, stringIndexOf2); //decs
      stringNext = center.slice(stringIndexOf2 + 1, center.length); //usage|example|group

      stringIndexOf3 = stringNext.indexOf("|");
      usage = stringNext.slice(0, stringIndexOf3); //usage
      stringNext2 = stringNext.slice(stringIndexOf3 + 1, stringNext.length); //example|group

      stringIndexOf4 = stringNext2.indexOf("|");
      example = stringNext2.slice(0, stringIndexOf4); //example
      group = stringNext2.slice(stringIndexOf4 + 1, stringNext2.length); //group

      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          var oldDataJSON = JSON.parse(data);
          var pushJSON = {
            name: name,
            decs: decs,
            usage: usage,
            example: example,
            group: group
          };
          oldDataJSON.push(pushJSON);
          let newData = JSON.stringify(oldDataJSON);
          fs.writeFile(
            __dirname + "/src/listCommands.json",
            newData,
            "utf-8",
            err => {
              if (err) throw err;
              api.sendMessage("Ghi lệnh mới hoàn tất!", threadID);
            }
          );
        }
      );

      return;
    }
    
    //delete lệnh trong help
    if (
      contentMessage.indexOf(`${prefix}delhelp`) == 0 &&
      admins.includes(senderID)
    ) {
      var string = contentMessage.slice(
        prefix.length + 8,
        contentMessage.length
      );
      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          var oldDataJSON = JSON.parse(data);
          /*var pushJSON = oldDataJSON.filter(object => {
            return object.name !== string;
          }); */
          const index = oldDataJSON.findIndex(x => x.name === string);

          if (index !== undefined) oldDataJSON.splice(index, 1);
          // oldDataJSON.push(pushJSON);
          let newData = JSON.stringify(oldDataJSON);
          api.sendMessage(newData, threadID);
          fs.writeFile(
            __dirname + "/src/listCommands.json",
            newData,
            "utf-8",
            err => {
              if (err) throw err;
              api.sendMessage("Ghi lệnh mới hoàn tất!", threadID);
            }
          );
        }
      );
      return;
    }

    //export file json
    if (
       contentMessage == `${prefix}extracthelp` &&
       admins.includes(senderID)
    ) {
      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          api.sendMessage(data, threadID);
        }
      );
      return;
    }
    
    if (contentMessage.indexOf(`${prefix}help`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Nhập lệnh cần giúp đỡ đi bạn ơi", threadID);
        
      if (content == 'all') {
        fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err) throw err;
          var helpMe = JSON.parse(data);
          var helpList = [];
          var helpName = "";
          helpMe.forEach(item => {
            helpList.push(item.name);
          });
          helpList.map(item => {
            helpName = helpName + item + ", ";
          });
          helpName = helpName.slice(0, -2);

          return api.sendMessage('Đây là toàn bộ lệnh của bot: ' + helpName, threadID);
        });
        return;
      }
      fs.readFile(
        __dirname + "/src/listCommands.json",
        "utf-8",
        (err, data) => {
          if (err)
            return api.sendMessage("Đã xảy ra lỗi không mong muốn!", threadID);
          var helpMe = JSON.parse(data);
          if (helpMe.some(item => item.name == content)) {
            api.sendMessage(
              `Thông tin lệnh bạn đang tìm: \n - tên: ${
                helpMe.find(item => item.name == content).name
              } \n - Thông tin: ${
              helpMe.find(item => item.name == content).decs
              } \n - usage: ${
              helpMe.find(item => item.name == content).usage
              } \n - Hướng dẫn sử dụng: ${
                helpMe.find(item => item.name == content).example
              } \n - Thuộc loại: ${
                helpMe.find(item => item.name == content).group
              }`,
              threadID);
          }
          else {
            var helpList = [];
            var helpName = "";
            helpMe.forEach(item => {
              if (content !== item.name) helpList.push(item.name);
            });
            helpList.map(item => {
              helpName = helpName + item + ", ";
            });
            helpName = helpName.slice(0, -2);
            return api.sendMessage('Lệnh bạn nhập không tồn tại, đây là danh sách lệnh của bot: ' + helpName, threadID);
          }
        });
      return;
    }


/* ==================== Random Pics ================*/

    if (contentMessage.indexOf(`${prefix}anime`) == 0) {
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      const request = require("request");
      var content = contentMessage.slice(
        prefix.length + 6,
        contentMessage.length
      );
      var jsonData = fs.readFileSync(__dirname + "/src/endpoints.json");
      var data = JSON.parse(jsonData);
      var baseURL = 'https://nekos.life/api/v2';
			var url = "";

			let sfwList = [];
			let sfwTags = "";
			Object.keys(data.sfw).forEach((endpoint) => {
				sfwList.push(endpoint);
			});
			sfwList.map(item => {
				sfwTags = sfwTags + item + ", ";
			});
			sfwTags = sfwTags.slice(0, -2);

			let nsfwList = [];
			let nsfwTags = "";
			Object.keys(data.nsfw).forEach((endpoint) => {
				nsfwList.push(endpoint);
			});
			nsfwList.map(item => {
				nsfwTags = nsfwTags + item + ", ";
			});
			nsfwTags = nsfwTags.slice(0, -2);
			
			if (data.sfw.hasOwnProperty(content))
				url = baseURL + data.sfw[content];
			else if (data.nsfw.hasOwnProperty(content)) 
				url = baseURL + data.nsfw[content];
			else if (!content || !data.nsfw.hasOwnProperty(content) || !data.sfw.hasOwnProperty(content))
				return api.sendMessage(
					`=== Tất cả các tag SFW ===\n` + sfwTags + `\n\n=== Tất cả các tag NSFW ===\n` + nsfwTags,
					threadID);

			request({
				uri: url
						},
			(error, response, body) => {
				let picData = JSON.parse(body);
				let getURL = picData.url;
				let ext = getURL.substring(getURL.lastIndexOf('.') + 1);
				let callback = function() {
					let up = {
						body: "",
						attachment: fs.createReadStream(__dirname + `/src/anime.${ext}`)
					};
					api.sendMessage(up, threadID);
					fs.unlinkSync(__dirname + `/src/anime.${ext}`);
				};
				request(getURL).pipe(fs.createWriteStream(__dirname + `/src/anime.${ext}`)).on('close', callback);
			});	
			return;
		}
    
    if (contentMessage == `${prefix}cat`) {
      request(
        "https://api.tenor.com/v1/random?key=73YIAOY3ACT1&q=cat&limit=1",
        (err, response, body) => {
          if (err) throw err;
          var string = JSON.parse(body);
          var stringURL = string.results[0].media[0].tinygif.url;
          console.log(stringURL);
          let callback = function() {
            let up = {
              body: "",
              attachment: fs.createReadStream(__dirname + `/src/randompic.gif`)
            };
            api.sendMessage(up, threadID, () =>
              fs.unlinkSync(__dirname + `/src/randompic.gif`)
            );
          };
          request(stringURL)
            .pipe(fs.createWriteStream(__dirname + `/src/randompic.gif`))
            .on("close", callback);
        }
      );
      return;
    }

/* ==================== General Commands ================ */

    //wiki
    if (contentMessage.indexOf(`${prefix}wiki`) == 0) {
      const wiki = require("wikijs").default;
      var url = "https://vi.wikipedia.org/w/api.php";
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (contentMessage.indexOf("en") == 6) {
        url = "https://en.wikipedia.org/w/api.php";
        content = contentMessage.slice(
          prefix.length + 8,
          contentMessage.length
        );
      }
      if (!content) return api.sendMessage("Nhập thứ cần tìm!", threadID);
      wiki({ apiUrl: url })
        .page(content)
        .catch(err =>
          api.sendMessage("Không tìm thấy thông tin bạn cần", threadID)
        )
        .then(page => {
          if (typeof page == "undefined") return;
          Promise.resolve(page.summary()).then(val =>
            api.sendMessage(val, threadID)
          );
        });
      return;
    }

    //ping
    if (contentMessage == `${prefix}ping`) {
      api.getThreadInfo(threadID, function(err, info) {
        if (err) throw err;
        ids = info.participantIDs;
        botid = api.getCurrentUserID();
        callid = {
          body: "Ping🏓",
          mentions: [
            {
              tag: `${botid}`,
              id: botid
            }
          ]
        };
        ids.forEach(getid => {
          addthis = {
            tag: `${getid}`,
            id: getid
          };
          callid["mentions"].push(addthis);
        });
        api.sendMessage(callid, threadID);
      });
      return;
    }

   /* //detect
    if (contentMessage == `${prefix}swearing on`) {
      delete checkCrapList[threadID];
      onoff = true;
      api.sendMessage("Đã bật nhắc nhở nói tục!", threadID);
      console.log(checkCrapList);
      return console.log("on swearing");
    } else if (contentMessage == `${prefix}swearing off`) {
      checkCrapList[threadID] = false;
      onoff = false;
      api.sendMessage("Đã tắt nhắc nhở nói tục!", threadID);
    }

    if (modules.checkCrap(contentMessage)) {
      if (!checkCrapList.hasOwnProperty(threadID)) {
        if (admins.includes(senderID)) {
          api.sendMessage(`Master hạn chế nói bậy đi ạ :(`, threadID);
          checkCrapList[threadID] = false;
          return;
        } else {
          api.sendMessage(
            ` hạn chế nói bậy đi ạ, bọn mình là người văn hoá :(`,
            threadID
          );
          checkCrapList[threadID] = false;
          return;
        }
      }
    }

    //count nói bậy
    if (modules.checkCrap(contentMessage)) {
      if (!fs.existsSync("userCount.json")) {
        firstJSON = {
          users: []
        };
        fs.writeFile(
          "userCount.json",
          JSON.stringify(firstJSON),
          "utf-8",
          err => {
            if (err) throw err;
          }
        );
      }
      fs.readFile("userCount.json", "utf-8", function(err, data) {
        if (err) throw err;
        oldData = JSON.parse(data);
        if (!oldData.users.some(item => item.id == senderID)) {
          oldData.users.push({
            id: `${senderID}`,
            count: 1
          });
        } else {
          for (var i = 0; i < oldData.users.length; i++) {
            if (oldData.users[i].id == senderID) {
              oldData.users[i].count += 1;
              break;
            }
          }
        }
        const newData = JSON.stringify(oldData);
        fs.writeFile("userCount.json", newData, "utf-8", err => {
          if (err) throw err;
          api.sendMessage(newData, threadID);
        });
      });
      return;
    }
    
    */
    
    if (senderID == threadID)
      return api.sendMessage('Bạn vui lòng add bot vào nhóm để bot hoạt động tối ưu hơn!', threadID);

    //gọi bot
    if (contentMessage == `${prefix}sumi`)
      return api.sendMessage(`Dạ gọi Sumi ạ?`, threadID);

    //lenny
    if (contentMessage == `${prefix}lenny`)
      return api.sendMessage("( ͡° ͜ʖ ͡°) ", threadID);

    //hug
    if (contentMessage == `${prefix}hug`)
      return api.sendMessage(" (つ ͡° ͜ʖ ͡°)つ  ", threadID);

    //mlem
    if (contentMessage == `${prefix}mlem`)
      return api.sendMessage(" ( ͡°👅 ͡°)  ", threadID);
    //care
    if (contentMessage == `${prefix}care`)
      return api.sendMessage("¯\\_(ツ)_/¯", threadID);

    //prefix
    if (contentMessage == `prefix`)
      return api.sendMessage("Prefix is: !", threadID);
      
    if (contentMessage.indexOf('credits') !== -1)
      return api.sendMessage('Project Sumi-chan-bot được thực hiện bởi:\n SpermLord: https://www.facebook.com/LiterallyASperm \n CatalizCS: https://www.facebook.com/Cataliz2k\n Full source code at: https://github.com/roxtigger2003/Sumi-chan-bot#readme !', threadID);

    //simsimi
    if (contentMessage.indexOf(`${prefix}sim`) == 0) {
      var content = contentMessage
        .slice(prefix.length + 4, contentMessage.length)
        .trim();
      if (!content) return api.sendMessage("Nhập tin nhắn!", threadID);

      let url = `http://ghuntur.com/simsim.php?lc=vn&deviceId=&bad=0&txt=${content}`;
      url = encodeURI(url);
      request(
        {
          uri: url
        },
        function(error, response, body) {
          api.sendMessage(body, threadID);
        }
      );
      return;
    }

    //tìm vị trí theo ip
    if (contentMessage.indexOf(`${prefix}local`) == 0) {
      let callback = function() {
        delete require.cache[
          require.resolve(__dirname + "/src/findlocaltion.json")
        ];
        let iplocal = require(__dirname + "/src/findlocaltion.json");
        console.log(iplocal);
        if (iplocal.status == "success") {
          api.sendMessage(
            " Toàn bộ thông tin về ip: " +
              iplocal.query +
              "\n - Thành phố: " +
              iplocal.city +
              "\n - Tên miền: " +
              iplocal.regionName +
              "\n - Quốc gia: " +
              iplocal.country +
              "\n - Núi giờ: " +
              iplocal.timezone +
              "\n - AS mumber và tổ chức: " +
              iplocal.as +
              "\n - Tên tổ chức: " +
              iplocal.org +
              "\n - Tên ISP: " +
              iplocal.isp +
              ".",
            threadID
          );
        } else {
          api.sendMessage(
            "ip bạn nhập không tổn tại hoặc hệ thống lỗi, vui lòng thử lại sau! Lỗi: " +
              iplocal.status +
              " | " +
              iplocal.message +
              ".",
            threadID,  () => {
                fs.unlinkSync(__dirname + "/src/findlocaltion.json")});
          
        }
      };
      apilocal.api(
        contentMessage.slice(prefix.length + 6, contentMessage.length),
        callback
      );
      return;
    }

    //thời tiết
    if (contentMessage.indexOf(`${prefix}weather`) == 0) {
      let callback = function() {
        delete require.cache[require.resolve(__dirname + "/src/weather.json")];
        let weatherdata = require(__dirname + "/src/weather.json");
        if (weatherdata.cod == "200") {
          api.sendMessage(
            `☁️ thời tiết
------------------------------
🗺Địa Điểm: ` +
              weatherdata.name +
              `\n - 🌡nhiệt độ hiện tại: ` +
              weatherdata.main.temp +
              `°C \n - ☁️Bầu trời: ` +
              weatherdata.weather[0].description +
              `\n - 💦độ ẩm trong không khí: ` +
              weatherdata.main.humidity +
              `% \n - 💨tốc độ gió: ` +
              weatherdata.wind.speed +
              `km/h `,
            threadID
          , () => {
                fs.unlinkSync(__dirname + "/src/weather.json")});
        } else {
          api.sendMessage(`Thông tin thành phố của bạn không đúng!`, threadID);
          return;
        }
      };
      weather.api(
        contentMessage.slice(prefix.length + 8, contentMessage.length),
        callback
      );
      return;
    }

    //say
    if (contentMessage.indexOf(`${prefix}say`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 4,
        contentMessage.length
      );

      let callback = function() {
        let m = {
          body: "",
          attachment: fs.createReadStream(__dirname + "/src/say.mp3")
        };
        api.sendMessage(m, threadID, () => {
                fs.unlinkSync(__dirname + "/src/say.mp3")});
      };
      if (contentMessage.indexOf("jp") == 5)
        tts.other(
          contentMessage.slice(prefix.length + 7, contentMessage.length),
          "ja",
          callback
        );
      else if (contentMessage.indexOf("en") == 5)
        tts.other(
          contentMessage.slice(prefix.length + 7, contentMessage.length),
          "en-US",
          callback
        );
      else if (contentMessage.indexOf("ko") == 5)
        tts.other(
          contentMessage.slice(prefix.length + 7, contentMessage.lenght),
          "ko",
          callback
        );
      else if (contentMessage.indexOf("ru") == 5)
        tts.other(
          contentMessage.slice(prefix.lenght + 7, contentMessage.lenght),
          "ru",
          callback
        );
      else tts.vn(content, callback);
      return;
    }

    //cập nhật tình hình dịch
    if (contentMessage == `${prefix}corona`) {
      let callback = function() {
        var data = require(__dirname + "/src/corona.json");
        api.sendMessage(
          "Thế giới: \n - Nhiễm: " +
            data.data.global.cases +
            "\n - Chết: " +
            data.data.global.deaths +
            "\n - Hồi phục: " +
            data.data.global.recovered +
            "\n Việt Nam:\n - Nhiễm: " +
            data.data.vietnam.cases +
            "\n - Chết: " +
            data.data.vietnam.deaths +
            "\n - Phục hồi: " +
            data.data.vietnam.recovered,
          threadID,  () => {
                fs.unlinkSync(__dirname + "/src/corona.json")});
        
      };
      takedata.take(callback);
      return;
    }

    //tuỳ chọn
    if (contentMessage.indexOf(`${prefix}choose`) == 0) {
      var input = contentMessage
        .slice(prefix.length + 7, contentMessage.length)
        .trim();
      if (input.lenght == 0)
        return api.sendMessage(`Bạn không nhập đủ thông tin kìa :(`, threadID);
      var array = input.split(" | ");
      var rand = Math.floor(Math.random() * array.length);

      api.sendMessage(
        `hmmmm, em sẽ chọn giúp cho là: ` + array[rand] + `.`,
        threadID
      );
      return;
    }
    
    //waifu
    if (contentMessage === `${prefix}waifu`) {
      var route = Math.round(Math.random() * 10);
      if (route == 1 || route == 0) {
        api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID);
        api.sendMessage("Yêu chàng nhiều <3", threadID);
        return;
      } else if (route == 2) {
        api.sendMessage("Làm Bạn thôi nhé :'(", threadID);
        return;
      } else if (route == 3) {
        api.sendMessage("Dạ em sẽ làm vợ anh <3", threadID);
        api.sendMessage("Yêu chàng nhiều <3", threadID);
        return;
      } else if (route > 4) {
        api.sendMessage("-.-", threadID);
        api.sendMessage("Chúng ta chỉ là bạn thôi :'(", threadID);
        return;
      }
    }

    //ramdom con số
    if (contentMessage == `${prefix}roll`) {
      var roll = Math.round(Math.random() * 100);
      api.sendMessage("UwU Your Number is " + roll + " ", threadID);
      return;
    }

    //tát người bạn
    if (contentMessage.indexOf(`${prefix}tát`) == 0) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var x = contentMessage
          .slice(prefix.length + 5, contentMessage.length)
          .trim();
        api.sendMessage(
          {
            body: x + " Vừa Bị Vả Vỡ Mồm \n",
            mentions: [
              {
                tag: x,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID
        );
      }
      return;
    }

    if (contentMessage.indexOf(`${prefix}đấm`) == 0) {
      for (var i = 0; i < Object.keys(event.mentions).length; i++) {
        var x = contentMessage
          .slice(prefix.length + 4, contentMessage.length)
          .trim();
        api.sendMessage(
          {
            body: x + " vừa bị đấm cho thọt 2 hòn lên họng",
            mentions: [
              {
                tag: x,
                id: Object.keys(event.mentions)[i]
              }
            ]
          },
          threadID
        );
      }
      return;
    }

    //Khiến bot nhái lại tin nhắn bạn
    if (contentMessage.indexOf(`${prefix}echo`) == 0) {
      let echotext = contentMessage
        .slice(prefix.length + 4, contentMessage.length)
        .trim();
      if (
        echotext.indexOf(`${prefix}ban`) !== -1 ||
        echotext.indexOf(`${prefix}unban`) !== -1 ||
        echotext.indexOf(`${prefix}getname`) !== -1 ||
        echotext.indexOf(`${prefix}update`) !== -1 ||
        echotext.indexOf(`${prefix}boostrank`) !== -1 ||
        echotext.indexOf(`${prefix}reset`) !== -1 ||
        echotext.indexOf(`${prefix}delhelp`) !== -1 ||
        echotext.indexOf(`${prefix}sethelp`) !== -1 ||
        echotext.indexOf(`${prefix}deletejson`) !== -1 ||
        echotext.indexOf(`${prefix}extracthelp`) !== -1
      )
        return api.sendMessage(`Định làm gì đếy?`, threadID);
      api.sendMessage(`${echotext}`, threadID);
      return;
    }

    //rank
    if (contentMessage == `${prefix}rank`)
      api.getUserInfo(senderID, (err, result) => {
        if (err) return modules.log(err, 2);
        const { name } = result[senderID];

        Rank.getPoint(senderID)
          .then(point => createCard({ id: senderID, name, ...point }))
          .then(path =>
            api.sendMessage(
              { body: "", attachment: fs.createReadStream(path) },
              threadID,
              () => {
                fs.unlinkSync(path);
              }
            )
          );
      });
      
      //dịch ngôn ngữ
      if (contentMessage.indexOf(`${prefix}trans`) == 0) {
      var yandex = "";
      var content = contentMessage.slice(
        prefix.length + 6,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(
          "Bạn chưa nhập thông tin, vui lòng đọc !help để biết thêm chi tiết!",
          threadID
        );
      if (content.indexOf("->") !== -1) {
        let string = content.indexOf("->");
        let rightString = content.slice(string + 2, string.length);
        let leftString = content.slice(0, string);
        console.log(rightString + leftString);
        if (rightString.length !== 0 && leftString.length !== 0) {
          var yandex = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20200418T073103Z.c4ef03f424190059.03004d3b28130ebf6f8c3e71df34f2a413882c96&text=${encodeURIComponent(
            leftString
          )}&lang=${encodeURIComponent(rightString)}`;
          request({ uri: yandex }, (err, response, body) => {
            var retrieve = JSON.parse(body);
            convert = retrieve.text[0];
            language = retrieve.lang;
            splitLang = language.split("-");
            fromLang = splitLang[0];
            toLang = splitLang[1];
            console.log(retrieve.code);
            console.log(convert);
            if (err)
              return api.sendMessage(
                "Server đã xảy ra vấn đề, vui lòng báo lại cho admin!!!",
                threadID
              );
            api.sendMessage(
              " '" + convert + "' Được dịch từ " + fromLang + " sang " + toLang,
              threadID
            );
          });
          return;
        } else {
          api.sendMessage(
            " Bạn đã nhập sai format! vui lòng đọc hướng dẫn sử dụng trong !help",
            threadID
          );
          return;
        }
      }
      return;
    }
    
    //châm ngôn sống
    if (contentMessage == `${prefix}quotes`) {
      fs.readFile(__dirname + "/src/quotes.json", "utf-8", function(err, data) {
        var stringData = JSON.parse(data);
        randomQuotes =
          stringData[Math.floor(Math.random() * stringData.length)];
        api.sendMessage(
          'Quote: \n "' +
            randomQuotes.text +
            '"\n     -' +
            randomQuotes.author +
            "-",
          threadID
        );
      });
      return;
    }
    
    //khiến bot làm toán ?!
    if (contentMessage.indexOf(`${prefix}math`) == 0) {
      var m = contentMessage.slice(prefix.length + 5, contentMessage.length);
      var o = m.replace(/ /g, "+");
      var l = "http://lmgtfy.com/?q=" + 0;
      request(wolfram + encodeURIComponent(m), function(err, response, body) {
        if (body.toString() === "Wolfram|Alpha did not understand your input") {
          api.sendMessage(l, threadID);
        } else if (
          body.toString() === "Wolfram|Alpha did not understand your input"
        ) {
          api.sendMessage("I Don't understand your question :3 ", threadID);
        } else if (body.toString() === "My name is Wolfram Alpha.") {
          api.sendMessage("My name is Sumi-chan.", threadID);
        } else if (
          body.toString() === "I was created by Stephen Wolfram and his team."
        ) {
          api.sendMessage(
            "I Was Created by Catalizcs, I love him too <3",
            threadID
          );
        } else if (
          body.toString() ===
          "I am not programmed to respond to this dialect of English."
        ) {
          api.sendMessage(
            "Tôi không được lập trình để nói những thứ vô học như này\n:)",
            threadID
          );
        } else if (
          body.toString() ===
          "StringJoin(CalculateParse`Content`Calculate`InternetData(Automatic, Name))"
        ) {
          api.sendMessage("I Don't know how to answer this question", threadID);
        } else api.sendMessage(body, threadID);
        return;
      });
      return;
    }    

/* ==================== NSFW Commands ==================== */

    //nhentai ramdom code
    if (contentMessage == `${prefix}nhentai -r`) {
      let ramdomnhentai = Math.floor(Math.random() * 99999);
      api.sendMessage(
        `Code lý tưởng của nii-chan là: ${ramdomnhentai}`,
        threadID
      );
      return;
    }

    //nhentai search
    if (contentMessage.indexOf(`${prefix}nhentai -i`) == 0) {
      let linknhentai = contentMessage
        .slice(prefix.length + 11, contentMessage.length)
        .trim();
      nhentai
        .get(
          contentMessage.slice(prefix.length + 11, contentMessage.length).trim()
        )
        .then(res => {
          if (!res.error) {
            let tags = "";
            res.tags.map(e => {
              tags = tags + e + ", ";
            });
            api.sendMessage("title: " + res.title, threadID);
            api.sendMessage(
              "pages: " + res.pages + "\nfavorites: " + res.favorites
            );
            api.sendMessage(
              "tags: \n" + tags.slice(0, tags.length - 2),
              threadID
            );
            api.sendMessage(
              `link: https://nhentai.net/g/${linknhentai}`,
              threadID
            );
          } else api.sendMessage("lỗi, id không xác định 😞", threadID);
        });
      return;
    }

/* ==================== Game Commands ==================== */

     //lấy thông tin osu!
    if (contentMessage.indexOf(`${prefix}osuinfo -u`) == 0) {
      var username = contentMessage
        .slice(prefix.length + 11, contentMessage.length)
        .trim();
      var main = osuApi
        .apiCall("/get_user", {
          u: username
        })
        .then(user => {
          api.sendMessage(
            `OSU INFO\n - username : ` +
              user[0].username +
              `\n - level :` +
              user[0].level +
              `\n - playcount :` +
              user[0].playcount +
              `\n - CountryRank : ` +
              user[0].pp_country_ran +
              `\n - Total PP* : ` +
              user[0].pp_raw +
              `\n - Hit Accuracy :` +
              user[0].accuracy
              ,
            threadID
          );
        });
      return;
    }
    /*todo list:
     - Game LOL
     - Game CSGO
     - Game Dota2
     - More and More
    
      
/* ==================== Media Commands ==================== */

    //get video facebook
    if (contentMessage.indexOf(`${prefix}facebook -p`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 12,
        contentMessage.length
      );
      console.log(content);
      var geturl = "";
      if (content.length == 0)
        return api.sendMessage(`Bạn chưa nhập link`, threadID);
      api.sendMessage("Đợi em một xíu...", threadID);
      require("fb-video-downloader")
        .getInfo(content)
        .then(info => {
          let gg = JSON.stringify(info, null, 2);
          let data = JSON.parse(gg);
          let urldata = data.download.sd;
          console.log(urldata);
          const dlfb = require("./modules/fbdl");
          console.log(geturl);
          //var textdemo = geturl.download.sd;
          let callback = function() {
            let up = {
              body: "",
              attachment: fs.createReadStream(__dirname + "/src/video.mp4")
            };
            api.sendMessage(up, threadID, () => {
                fs.unlinkSync(__dirname + "/src/video.mp4")});
          };
          dlfb.take(urldata, callback);
        });
      return;
    }

    //get video youtube
    if (contentMessage.indexOf(`${prefix}youtube -p`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 11,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(" Bạn chưa nhập link youtube!", threadID);
      if (content.indexOf('youtu.be') !== -1)
        return api.sendMessage("url không nằm trong vùng hỗ trợ");
        
      ytdl.getInfo(content, function(err, info) {
        if (err) throw err;
        if (info.length_seconds > 245)
          return api.sendMessage(
            "link Video dài quá 3 phút, xin vui lòng gửi link video khác!",
            threadID
          );
        api.sendMessage(` đợi em một xíu em đang xử lý...`, threadID);
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/video.mp4")
          };
          api.sendMessage(up, threadID, () => {
                fs.unlinkSync(__dirname + "/src/video.mp4")});
        };
        playvideo.youtube(
          contentMessage
            .slice(prefix.length + 11, contentMessage.length)
            .trim(),
          callback
        );
      });

      return;
    }

    //get audio youtube
    if (contentMessage.indexOf(`${prefix}youtube -m`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 11,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Bạn chưa nhập link!", threadID);
      if (content.indexOf('youtu.be') !== -1)
        return api.sendMessage("url không nằm trong vùng hỗ trợ");

      ytdl.getInfo(content, function(err, info) {
        if (err) throw err;
        if (info.length_seconds > 360)
          return api.sendMessage(
            "Độ dài video vượt quá mức cho phép, tối thiểu là 5 phút!",
            threadID
          );
        api.sendMessage(" đợi em một xíu em đang xử lý...", threadID);
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/music.mp3")
          };
          api.sendMessage(up, threadID, () => {
                fs.unlinkSync(__dirname + "/src/music.mp3")});
        };
        music.youtube(
          contentMessage.slice(prefix.length + 6, contentMessage.length).trim(),
          callback
        );
      });
      return;
    }
    
    //get search data youtube
    if (contentMessage.indexOf(`${prefix}youtube -s`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 11,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Bạn chưa nhập thông tin");
      request(youtube + encodeURIComponent(content), function(
        err,
        response,
        body
      ) {
        if (err) {
          api.sendMessage("Lỗi cmnr :|", threadID);
          return;
        }
        var retrieve = JSON.parse(body);
        var link = retrieve.items[0].id.videoId;
        var title = retrieve.items[0].snippet.title;
        var thumbnails = retrieve.items[0].snippet.thumbnails.high.url;
        api.sendMessage(`https://www.youtube.com/watch?v=` + link, threadID);
        api.sendMessage(title, threadID);
      });
      return;
    }
  };
};
/* 1510 line commands was made by Catalizcs(roxtigger2003) and SpermLord(spermlord) with love <3, pls dont delete this credits! THANKS very much */
