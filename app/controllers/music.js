const request = require('request-promise').defaults({
    resolveWithFullReponse: false,
    json: true
});
const cheerio = require('cheerio');

function gettoken() {
    return request({
        method: 'POST',
        url: "https://graph.nhaccuatui.com/v1/commons/token",
        form: {
            deviceinfo: '{"DeviceID":"dd03852ada21ec149103d02f76eb0a04","DeviceName":"AppTroLyBeDieu","OsName":"WINDOWS","OsVersion":"8.0","AppName":"NCTTablet","AppTroLyBeDieu":"1.3.0","UserName":"0","QualityPlay":"128","QualityDownload":"128","QualityCloud":"128","Network":"WIFI","Provider":"NCTCorp"}',
            md5: 'ebd547335f855f3e4f7136f92ccc6955',
            timestamp: 1499177482892
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Host: 'graph.nhaccuatui.com',
            Connection: 'Keep-Alive'
        }

    })
        .then(e => e && e.data && e.data.accessToken)
        .catch(e => {
            throw e;
            return;
        })


}
async function getInfo(idBaiHat) {
    const infoMusic = {};
    const access_token = await gettoken();
    const infoGet = await request.get({
        url: `https://graph.nhaccuatui.com/v1/songs/${idBaiHat}`,
        qs: {
            access_token
        }
    })
    infoMusic.name = infoGet.data[2];
    infoMusic.singer = infoGet.data[3];
    infoMusic.thumbnail = infoGet.data[8];
    infoMusic.link = /* infoGet.data[19] || infoGet.data[12] || infoGet.data[11] || */ infoGet.data[7];//Tránh file quá lớn
    return infoMusic;
}

async function search(q) {
    const html = await request({
        uri: "https://www.nhaccuatui.com/tim-kiem/bai-hat",
        qs: {
            q,
            b: 'keyword',
            l: 'tat-ca',
            s: 'default'
        }
    })
    const $ = cheerio.load(html);
    const searchDom = $('.sn_search_single_song > .box_info');
    const result = new Array();
    searchDom.slice(0, 5).each(function () {
        result.push({
            name: $(this).children('.title_song').text() || '<không tên>',
            singer: $(this).children('.singer_song').text() || '<không rõ>',
            id: $(this).children('.title_song').children('a').attr('href').split('.')[3]
        });
    });
    return result;
}
module.exports = {
    search,
    getInfo
}