const saveAttachment = require("./saveAttachment");
const fs = require("fs");
module.exports = function({ api }) {
  return function(url, threadID, body = "", callback = f => f) {
    saveAttachment(url)
      .then(path => {
        api.sendMessage(
          { body, attachment: fs.createReadStream(path) },
          threadID,
          () => {
            fs.unlinkSync(path);
            callback(undefined);
          }
        );
      })
      .catch(callback);
  };
};
