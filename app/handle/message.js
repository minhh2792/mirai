const fs = require("fs");
const createCard = require("../controllers/rank_card");
const osu = require("node-osu");
const ytdl = require("ytdl-core");
var checkthreadid = [];
var sleeptime = [];
var wakelist = [];
var playmusic = [];
var checkCrapList = [];
var onoff = true;
var d = new Date();
var utc = d.getTime() + d.getTimezoneOffset() * 60000;
var nd = new Date(utc + 3600000 * 7);
var h = nd.getHours();

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
  return function({ event }) {
    let { body: contentMessage, senderID, threadID } = event;
    senderID = parseInt(senderID);
    threadID = parseInt(threadID);
    var osuApi = new osu.Api("f542df9a0b7efc666ac0350446f954740a88faa8", {
      notFoundAsError: true,
      completeScores: false
    });
    function osuinfo(username) {
      var main = osuApi
        .apiCall("/get_user", {
          u: username
        })
        .then(user => {
          api.sendMessage(
            `*OSU INFO*\n*username* : ` +
              user[0].username +
              `\n*level* :` +
              user[0].level +
              `\n*playcount* :` +
              user[0].playcount +
              `\n*CountryRank* : ` +
              user[0].pp_country_ran +
              `\n*Total PP* : ` +
              user[0].pp_raw +
              `\n*Accuracy* :` +
              user[0].accuracy +
              `\n<3 `,
            threadID
          );
        });
      return api.sendMessage(main, threadID);
    }

    /* ================ BAN & UNBAN ==================== */

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
    
    /* ==================== SYSTEM ================ */
    
    //gửi report tới admin
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
          nd,
        admins
      );
      api.sendMessage("Thông tin lỗi của bạn đã được gửi về admin!", threadID);
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
    
    

    /* ==================== CRON JOB =============== */

    //nhắc đi ngủ trong thời gian từ 11h00PM đến 6h00AM
    if (h >= 23 && h <= 6 && !checkthreadid.hasOwnProperty(threadID)) {
      api.sendMessage(
        `Trễ rồi đấy nii-chan, mau tắt thiết bị rồi đi ngủ đi. おやすみなさい！ `,
        threadID,
        function() {
          console.log("nhắc đi ngủ thread: " + threadID);
          checkthreadid[threadID] = true;
        }
      );
      return;
    }

    //nhắc đi ngủ trong thời gian 10h00PM tới 11h00PM
    if (h >= 22 && h <= 23 && !sleeptime.hasOwnProperty(threadID)) {
      api.sendMessage(
        `Tới giờ ngủ rồi đấy nii-chan, おやすみなさい!  `,
        threadID,
        function() {
          console.log("nhắc đi ngủ thread: " + threadID);
          sleeptime[threadID] = true;
        }
      );
      return;
    }

    if (h >= 6 && h <= 9 && !wakelist.hasOwnProperty(threadID)) {
      api.sendMessage(
        ` おはようございま các nii-chan uwu `,
        threadID,
        function() {
          console.log("thread đã thức: " + threadID);
          wakelist[threadID] = true;
        }
      );
      return;
    }

    /* ==================== SMTHING ================ */
    
    //ping
    if (contentMessage == `${prefix}ping`) {
			api.getThreadInfo(threadID, function(err, info) {
				if (err) throw err;
				ids = info.participantIDs;
				botid = api.getCurrentUserID();
				callid = {
					body: "Ping🏓",
					mentions: [{
						tag: `${botid}`,
						id: botid
					}]
				}
				ids.forEach(getid => {
					addthis = {
						tag: `${getid}`,
						id: getid
					}
					callid["mentions"].push(addthis);
				});
				api.sendMessage(callid, threadID);
			});
			return;
		}

    //detect
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
    
    /* 
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

    //gọi bot
    if (
      contentMessage == `${prefix}sumi`
    )
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

    //wiki search
    if (contentMessage.indexOf(`${prefix}wiki`) == 0) {
      var content = contentMessage
        .slice(prefix.length + 5, contentMessage.length)
        .trim();
     if (content.length == 0)
        return api.sendMessage(
          `Bạn chưa nhập thông tin để tìm kiếm!`,
          threadID
        );
      const wtf = require("wtf_wikipedia");

      wtf.fetch(content).then(doc => {
        api.sendMessage("\n nội dung: " + doc.sentences(0).text(), threadID);
      });
      return;
    }
    
    //simsimi
    if (contentMessage.indexOf(`${prefix}sim`) == 0) {
      const request = require("request");
      var content = contentMessage
        .slice(prefix.length + 4, contentMessage.length)
        .trim();
      if (content.length == 0)
        return api.sendMessage(`Bạn chưa nhập thông tin kìa :(`, threadID);
      let url = `http://ghuntur.com/simsim.php?lc=vn&deviceId=&bad=0&txt=${content}`;
      let trueurl = encodeURI(url);
      var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET", trueurl, true);
      xmlHttp.onload = () => {
        api.sendMessage(xmlHttp.responseText, threadID);
      };
      xmlHttp.send();
      return;
    }

    //tìm vị trí theo ip
    if (contentMessage.indexOf(`${prefix}local`) == 0) {
      const apilocal = require("./modules/findlocaltion");
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
            threadID
          );
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
      const weather = require("./modules/weather");
      let callback = function() {
        delete require.cache[require.resolve(__dirname + "/src/weather.json")];
        let weatherdata = require(__dirname + "/src/weather.json");
        if (weatherdata.cod == "200") {
          api.sendMessage(
            `Thành phố: ` +
              weatherdata.name +
              `\n - nhiệt độ hiện tại: ` +
              weatherdata.main.temp +
              `°C \n - Bầu trời: ` +
              weatherdata.weather[0].description +
              `\n - độ ẩm trong không khí: ` +
              weatherdata.main.humidity +
              `% \n - tốc độ gió: ` +
              weatherdata.wind.speed +
              `km/h \n Tips: Thời tiết luôn cập nhật theo realtime, nên các bạn chú ý thời tiết để tránh các hoạt động vui chơi bị trì hoãn nha <3`,
            threadID
          );
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
      const tts = require("./modules/say");
      var content = contentMessage.slice(
        prefix.length + 4,
        contentMessage.length
      );

      let callback = function() {
        let m = {
          body: "",
          attachment: fs.createReadStream(__dirname + "/src/say.mp3")
        };
        api.sendMessage(m, threadID);
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
      const takedata = require("./modules/corona");
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
            data.data.vietnam.recovered +
            "\nTips: Nếu bạn có dấu hiệu như: ho, sốt cao, sổ mũi, khó thở, đau vòm họng hãy báo ngay cho bộ y tế với đường dây nóng: 19003228, 0989671115 và 0963851919 \n Tips: để bảo vệ sức khoẻ cho bản thân và cho mọi người xung quanh, tuyệt đối tránh ra khỏi nhà khi không cần thiết, nếu thấy bản thân hay người xung quanh có các triệu chứng của bệnh vui lòng báo ngay đến các cơ sở y tế gần đó hoặc gọi điện cho đường dây nóng của bộ y tế đã đề cập bên trên! #stayhome ",
          threadID
        );
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
        return api.sendMessage(
          `Bạn không nhập đủ thông tin kìa :(`,
          threadID
        );
      var array = input.split(" | ");
      var rand = Math.floor(Math.random() * array.length);

      api.sendMessage(
        `hmmmm, em sẽ chọn giúp cho là: ` + array[rand] + `.`,
        threadID
      );
      return;
    }

    //detect chửi bot
    if (
      contentMessage.indexOf("$đcm") > -1 ||
      contentMessage.indexOf("$Bot") > -1 ||
      contentMessage.indexOf("$bot") > -1 ||
      contentMessage.indexOf("$điếm") > -1 ||
      contentMessage.indexOf("sumi") > -1 ||
      contentMessage.indexOf("Sumi") > -1 ||
      contentMessage.indexOf("bot") > -1
    ) {
      if (
        contentMessage.indexOf("ngu") != -1 ||
        contentMessage.indexOf("cặc") != -1 ||
        contentMessage.indexOf("óc") != -1 ||
        contentMessage.indexOf("chó") != -1 ||
        contentMessage.indexOf("đm") != -1 ||
        contentMessage.indexOf("mẹ") != -1 ||
        contentMessage.indexOf("địt") != -1 ||
        contentMessage.indexOf("sủa") != -1 ||
        contentMessage.indexOf("súc vật") != -1 ||
        contentMessage.indexOf("như lồn") != -1 ||
        contentMessage.indexOf("đĩ") != -1 ||
        contentMessage.indexOf("cave") != -1 ||
        contentMessage.indexOf("lồn") != -1 ||
        contentMessage.indexOf("địt mẹ") != -1
      ) {
        const gud = require("./modules/music");
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/music.mp3")
          };
          api.sendMessage(up, threadID);
        };
        var myArray = [
          "https://www.youtube.com/watch?v=fMW1pmDjdH0",
          "https://youtu.be/VYjTNW3zGhA",
          "https://youtube.com/watch?v=hoo02dFNEYA"
        ];
        var rand = Math.floor(Math.random() * myArray.length);

        gud.youtube(myArray[rand], callback);
        return;
      }
    }

    //waifu
    if (contentMessage === `${prefix}waifu`) {
      var route = Math.round(Math.random() * 10);
      if (route == 1) {
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

    //Khiến bot nhái lại tin nhắn bạn
    if (contentMessage.indexOf(`${prefix}echo`) == 0) {
      let echotext = contentMessage
        .slice(prefix.length + 4, contentMessage.length)
        .trim();
      api.sendMessage(`${echotext}`, threadID);
      return;
    }

    //nhentai ramdom code
    if (contentMessage == `${prefix}nhentai -r`) {
      let ramdomnhentai = Math.floor(Math.random() * 99999);
      api.sendMessage(
        `Code lý tưởng của nii-chan là: ${ramdomnhentai}`,
        threadID
      );
      return;
    }

    //toàn bộ lệnh ở đây
    if (contentMessage == `${prefix}help`) {
      event.isGroup &&
        api.sendMessage(
        fs.readFileSync(__dirname + "/src/help.txt","utf-8")
          ,
          senderID
        );

      api.sendMessage(`check inbox đi nii-chan!`, threadID);
      return;
    }

    //lấy thông tin osu!
    if (contentMessage.indexOf(`${prefix}osuinfo -u`) == 0) {
      var username = contentMessage
        .slice(prefix.length + 11, contentMessage.length)
        .trim();

      osuinfo(username);
      return;
    }

    //nhentai search
    if (contentMessage.indexOf(`${prefix}nhentai -i`) == 0) {
      let nhentai = require("./modules/nhentai-search");
      let linknhentai = contentMessage
        .slice(prefix.length + 11, contentMessage.length)
        .trim();
      api.sendMessage(`link: https://nhentai.net/g/${linknhentai}`, threadID);
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
          } else api.sendMessage("lỗi, id không xác định 😞", threadID);
        });
      return;
    }

    //phát video
    if (contentMessage.indexOf(`${prefix}play`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 5,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage(" Bạn chưa nhập link youtube!", threadID);
      ytdl.getInfo(content, function(err, info) {
        if (err) throw err;
        if (info.length_seconds > 245)
          return api.sendMessage(
            "link Video dài quá 3 phút, xin vui lòng gửi link video khác!",
            threadID
          );
        const playvideo = require("./modules/playvideo");
        api.sendMessage(` đợi em một xíu em đang xử lý...`, threadID);
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/video.mp4")
          };
          api.sendMessage(up, threadID);
        };
        playvideo.youtube(
          contentMessage.slice(prefix.length + 4, contentMessage.length).trim(),
          callback
        );
      });

      return;
    }

    //phát nhạc
    if (contentMessage.indexOf(`${prefix}music`) == 0) {
      var content = contentMessage.slice(
        prefix.length + 6,
        contentMessage.length
      );
      if (content.length == 0)
        return api.sendMessage("Bạn chưa nhập link!", threadID);

      ytdl.getInfo(content, function(err, info) {
        if (err) throw err;
        if (info.length_seconds > 360)
          return api.sendMessage(
            "Độ dài video vượt quá mức cho phép, tối thiểu là 5 phút!",
            threadID
          );
        const music = require("./modules/music");
        api.sendMessage(" đợi em một xíu em đang xử lý...", threadID);
        let callback = function() {
          let up = {
            body: "",
            attachment: fs.createReadStream(__dirname + "/src/music.mp3")
          };
          api.sendMessage(up, threadID);
        };
        music.youtube(
          contentMessage.slice(prefix.length + 6, contentMessage.length).trim(),
          callback
        );
      });
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
  };
};
