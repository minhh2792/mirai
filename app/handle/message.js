const fs = require('fs');
const music = require("../controllers/music");
const createCard = require("../controllers/rank_card");
module.exports = function ({ api, modules, config, __GLOBAL, User, Thread, Rank }) {
    let { prefix, ENDPOINT, admins } = config;
    return function ({ event }) {
        let { body: contentMessage, senderID, threadID } = event;
        senderID = parseInt(senderID);
        threadID = parseInt(threadID);

        /* ================ BAN & UNBAN ==================== */

        if (__GLOBAL.userBlocked.includes(senderID)) {
            return;
        }
        // Unban thread
        if (__GLOBAL.threadBlocked.includes(threadID)) {
            if (contentMessage == `${prefix}unban thread` && admins.includes(senderID)) {
                const indexOfThread = __GLOBAL.threadBlocked.indexOf(threadID);
                if (indexOfThread == -1) return api.sendMessage("Nhóm này chưa bị chặn!", threadID);
                Thread.unban(threadID)
                    .then(success => {
                        if (!success) return api.sendMessage("Không thể bỏ chặn nhóm này!", threadID);
                        api.sendMessage("Nhóm này đã được bỏ chặn!", threadID);
                        //Clear from blocked
                        __GLOBAL.threadBlocked.splice(indexOfThread, 1);
                        modules.log(threadID, 'Unban Thread');
                    })

                return;
            }
            return;
        }

        Rank.updatePoint(senderID, 2);

        // Unban user
        if (contentMessage.indexOf(`${prefix}unban`) == 0 && admins.includes(senderID)) {
            const mentions = Object.keys(event.mentions);
            if (mentions.length == 0) return api.sendMessage('Vui lòng tag những người cần unban', threadID);
            mentions.forEach(mention => {
                const indexOfUser = __GLOBAL.userBlocked.indexOf(parseInt(mention));
                if (indexOfUser == -1) return api.sendMessage({
                    body: `${event.mentions[mention]} chưa bị ban, vui lòng ban trước!`,
                    mentions: [{
                        tag: event.mentions[mention],
                        id: mention
                    }]
                }, threadID);

                User.unban(mention)
                    .then(success => {
                        if (!success) return api.sendMessage("Không thể unban người này!", threadID);
                        api.sendMessage({
                            body: `Đã unban ${event.mentions[mention]}!`,
                            mentions: [{
                                tag: event.mentions[mention],
                                id: mention
                            }]
                        }, threadID);
                        //Clear from blocked
                        __GLOBAL.userBlocked.splice(indexOfUser, 1);
                        modules.log(mentions, 'Unban User');
                    })

            })
            return;
        }

        // Ban thread
        if (contentMessage == `${prefix}ban thread` && admins.includes(senderID)) {

            api.sendMessage("Bạn có chắc muốn ban group này ?", threadID, function (error, info) {
                if (error) return modules.log(error, 2);
                __GLOBAL.confirm.push({
                    type: "ban:thread",
                    messageID: info.messageID,
                    target: parseInt(threadID),
                    author: senderID
                })
            });
            return;

        }

        // Ban user
        if (contentMessage.indexOf(`${prefix}ban`) == 0 && admins.includes(senderID)) {

            const mentions = Object.keys(event.mentions);
            if (mentions.length == 0) return api.sendMessage('Vui lòng tag những người cần ban!', threadID);
            mentions.forEach(mention => {
                if (admins.includes(mention)) return api.sendMessage('Bạn không đủ thẩm quyền để ban người này?', threadID);
                api.sendMessage(
                    {
                        body: `Bạn có chắc muốn ban ${event.mentions[mention]}?`,
                        mentions: [{
                            tag: event.mentions[mention],
                            id: mention
                        }]
                    },
                    threadID,
                    function (error, info) {
                        if (error) return modules.log(error, 2);
                        __GLOBAL.confirm.push({
                            type: "ban:user",
                            messageID: info.messageID,
                            target: {
                                tag: event.mentions[mention],
                                id: parseInt(mention)
                            },
                            author: senderID
                        })
                    });
            })
            return;

        }

        /* ==================== SMTHING ================ */
        if (modules.checkCrap(contentMessage)) {
            api.sendMessage(`Onii-chan không được nói bậy nha >:(`, threadID);
            return;
        }

        if (contentMessage == `em ơi`) {
            api.sendMessage(`Dạ nii-chan gọi Sumi ạ?`, threadID);
            return;
        }
        
        //lenny
        if (contentMessage == `${prefix}lenny`) {
          api.sendMessage("( ͡° ͜ʖ ͡°) ", threadID)
        }
        
        //lenny
        if (contentMessage == `${prefix}care`) {
          api.sendMessage("¯\_(ツ)_/¯ ", threadID)
        }
        
        if (contentMessage == `prefix`) {
          api.sendMessage("Prefix is: !", threadID)
        }
        
        if (contentMessage == `${prefix}help`) {
            event.isGroup && api.sendMessage(`Nii-chan check tin nhắn của Sumi nha <3`, threadID);
            api.sendMessage(`đéo có đâu tìm cl à bạn eii ??? hỏi thằng làm ấy ( ͡° ͜ʖ ͡°)  `, senderID);
            return;
        }

        if (contentMessage.indexOf(`${prefix}say`) == 0) {

            let text = contentMessage.slice(prefix.length + 3, contentMessage.length).trim();
            modules.sendAttachment(ENDPOINT.GOOGLE_TTS + encodeURI(text), threadID, '', function (err) {
                if (err) modules.log(err, 2);
            })
            return;
        }
        
        if(contentMessage.indexOf("nhentai -i ") == 0){
                        let nhentai = require("./nhentai-search");
                        nhentai.get(contentMessage.slice(prefix.length + 11, contentMessage.length).trim())
                            .then((res) => {
                                if (!res.error) {
                                    let tags = "";
                                    res.tags.map(e => {tags = tags + e +", "});
                                    api.sendMessage("title: " + res.title,threadID);
                                    api.sendMessage("pages: " + res.pages + "\nfavorites: " + res.favorites);
                                    api.sendMessage({
                                        body:"preview image: ",
                                        attachment:[fs.createReadStream("./"+res.id+"/1.jpg"),fs.createReadStream("./"+res.id+"/2.jpg")]
                                    },threadID);
                                    api.sendMessage("tags: \n"+tags.slice(0,tags.length-2),threadID);
                                } else 
                                    api.sendMessage("lỗi, id không xác định 😞",threadID);
                            })
                    }
                    if(contentMessage.indexOf("nhentai -d ") == 0){
                        let nhentai = require("./nhentai-search");
                        nhentai.get(contentMessage.slice(prefix.length + 11, contentMessage.length).trim())
                            .then((res)=>{
                                nhentai.getStream(res.id,res["image-id"],res.pages)
                                    .then((att)=>{console.log(att);api.sendMessage({attachment:att},threadID)})
                            });
                    }
        
        if (contentMessage.indexOf(`${prefix}music`) == 0) {

            let query = contentMessage.slice(prefix.length + 5, contentMessage.length).trim();

            modules.log(`Tìm kiếm bài hát: ${query}`);
            music.search(query)
                .then(function (result) {
                    result.forEach(function (element, index) {
                        api.sendMessage(`Bài ${element.name} của ${element.singer}`, threadID, function (error, info) {
                            if (error) return modules.log(error, 2);
                            __GLOBAL.confirm.push({
                                type: "music",
                                messageID: info.messageID,
                                target: element,
                                author: senderID
                            })

                        })

                    });
                }).
                catch(error => {
                    api.sendMessage(`Lỗi :\n${error.stack}`)
                    modules.log(error, 2);
                })

            return;
        }
        if (contentMessage == `${prefix}rank`) {
            api.getUserInfo(senderID, (err, result) => {
                if (err) return modules.log(err, 2);
                const { name } = result[senderID];

                Rank.getPoint(senderID)
                    .then(point => createCard({ id: senderID, name, ...point }))
                    .then(path => api.sendMessage({ body: '', attachment: fs.createReadStream(path) }, threadID, () => {
                        fs.unlinkSync(path)
                    }))
        })
    }
}
}
