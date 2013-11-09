var request = require('request').defaults(process.env.http_proxy ? { 'proxy': process.env.http_proxy, jar:true }: {jar:true}),
  fs = require('fs'),
  cheerio = require('cheerio'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('grab geny pronos for: ' + date);

var loginPage= "http://www.geny.com/client/login";


var baseDir = __dirname+'/../datas/';
var baseUri = "http://www.geny.com/";
var summaryPage = "reunions-courses-pmu?date=";//2011-10-01
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/geny";

mkdirp(rawDir, 0777, function (errorMkdirp) {
  if (errorMkdirp) {
    console.error(errorMkdirp);
    process.exit(1);
  } else {
    //if(!fs.existsSync(rawDir+'/pronos')) {
      //console.log("Get summary page... " + baseUri+summaryPage+date);
      //console.log(process.env.http_proxy);
      request.post(loginPage, {form:misc.getGenyLogin()}, function (errLogRequest, respLog, bodyLog) {
          request(baseUri+summaryPage+date, function (errRequest, resp, body) {
            if (!errRequest && resp.statusCode === 200) {
              fs.writeFile(rawDir+'/summary', body, function(errWriteFile) {
                if(errWriteFile) {
                  console.log(errWriteFile);
                  process.exit(1);
                } else {
                  var $ = cheerio.load(body);
                  var pronosPage = $("a.btnQuinte:contains('partants/stats/prono')").attr('href');
                  console.log("Get pronos page... " + baseUri + pronosPage);
                  request(baseUri + pronosPage).pipe(fs.createWriteStream(rawDir+'/pronos'));
                }
              });
            }
          });
      });
    //} else {
    //  console.log(rawDir+'/pronos already exists');
    //}
  }
});

