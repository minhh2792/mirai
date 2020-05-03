const path = require("path")
module.exports = {
	development: false,
	prefix: process.env.PREFIX || '!', //prefix của bot
	botName: process.env.BOT_NAME || 'Sumi-Chan', //tên bot
	googleSearch: process.env.GOOGLE_SEARCH || 'AIzaSyDq7arcyv1OG694MJxGeikQKmprootf4Qs', //api google search
	wolfarm: process.env.WOLFARM || 'T8J8YV-H265UQ762K', //api wolfarm
	osuAPI: process.env.OSU_API || 'f542df9a0b7efc666ac0350446f954740a88faa8', //osu! api
	yandex: process.env.YANDEX || 'trnsl.1.1.20200418T073103Z.c4ef03f424190059.03004d3b28130ebf6f8c3e71df34f2a413882c96',
	tenor: process.env.TENOR || '73YIAOY3ACT1', //api tenor
	openweather: process.env.OPENWEATHER || '081c82065cfee62cb7988ddf90914bdd', //¯\_(ツ)_/¯ 
	steamAPI: process.env.STEAM_API || '',
	//edit id admin dưới đây
	admins: (process.env.ADMINS || 'uid1_uid2').split('_').map(e => parseInt(e)), //uid admin
	//đừng edit dưới này, cám ơn!
	developer: {
		uid: 100027477920916,
		email: 'rfechinonguyen@gmail.com',
		github: 'Roxtigger2003'
	},
	database: {
		postgres: {
			database: process.env.DB_NAME,
			username: process.env.DB_USER,
			password: process.env.DB_PASS,
			host: process.env.DB_HOST,
		},
		sqlite: {
			storage: path.resolve(__dirname, "./data.sqlite"),
		},
	},
	appStateFile: path.resolve(__dirname, '../appstate.json')
}