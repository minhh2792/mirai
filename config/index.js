const path = require("path")
module.exports = {
	development: false,
	mailFB: process.env.EMAIL || '',
	passFB: process.env.PASSWORD || '',
	prefix: process.env.PREFIX || '!',
	botName: process.env.BOT_NAME || 'Project Sumi-chan-bot | Create by Catalizcs and SpermLord!',
	googleSearch: process.env.GOOGLE_SEARCH || '',
	wolfarm: process.env.WOLFARM || '',
	yandex: process.env.YANDEX || '',
	tenor: process.env.TENOR || '',
	openweather: process.env.OPENWEATHER || '',
	saucenao: process.env.SAUCENAO || '', 
	admins: (process.env.ADMINS || '').split('_').map(e => parseInt(e)),
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