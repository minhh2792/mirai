require("dotenv").config();
const login = require("./app/login");
const { Sequelize, sequelize, Op } = require("./database");
const logger = require("./app/modules/log.js");
const { email, password, appStateFile } = require("./config");
const fs = require("fs");
const pm2 = require('pm2');
const express = require("express");
const app = express();
const __GLOBAL = new Object({
  threadBlocked: new Array(),
  userBlocked: new Array(),
  swearList: new Array(),
  confirm: new Array()
});

pm2.connect(function(err) {
  if (err) throw err;

  setTimeout(function worker() {
    console.log("Restarting app...");
    pm2.restart('app', function() {});
    setTimeout(worker, 1800000);
  }, 1800000);
});

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/view/index.html");
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

facebook = ({ Op, models }) =>
  login({ appState: require(appStateFile) }, function(
    error,
    api
  ) {
    if (error) return logger(error, 2);
    fs.writeFileSync(
      appStateFile,
      JSON.stringify(api.getAppState(), null, "\t")
    );
    logger("Đăng nhập thành công!", 0);
    //Listening
    api.listenMqtt(require("./app/listen")({ api, Op, models, __GLOBAL }));
  });
sequelize
  .authenticate()
  .then(
    () => logger("Connect database thành công!", 0),
    () => logger("Connect database thất bại!", 2)
  )
  .then(() => {
    let models = require("./database/model")({ Sequelize, sequelize });
    facebook({ Op, models });
  })
  .catch(e => {
    logger(`${e.stack}`, 2);
    // console.error(e);
  });
