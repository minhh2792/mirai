const moduleBuild = [
	'saveAttachment',
	'log'
]
const modules = new Object();
moduleBuild.forEach(function (v) {
	modules[`${v}`] = require(`./${v}.js`);
})
module.exports = modules;