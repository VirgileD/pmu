'use strict';

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

mkdirp(rawDir,function (errorMkdirp) {
  if (errorMkdirp) {
    console.error(errorMkdirp);
    process.exit(1);
  } else {
    if(!fs.existsSync(rawDir+'/pronos')) {
      console.log("Get summary page... " + baseUri+summaryPage+date+" to "+rawDir+'/summary');
      //console.log(process.env.http_proxy);
      request.post(loginPage, {form:misc.getGenyLogin()}, function (errLogRequest, respLog, bodyLog) {
        if(errLogRequest) console.error(errLogRequest);
        var options = {
            url: baseUri+summaryPage+date,
            headers: {
                "Accept":'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
"Accept-Language":'fr-FR,fr;q=0.8,en-US;q=0.6,en;q=0.4',
"Connection":'keep-alive',
"Host":'www.geny.com',
"User-Agent":'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/31.0.1650.63 Chrome/31.0.1650.63 Safari/537.36'
            }
        };
        request(options, function (errRequest, resp, body) {
            if(errRequest) console.error(errRequest);    
            if (!errRequest && resp.statusCode === 200) {
              fs.writeFile(rawDir+'/summary', body, function(errWriteFile) {
                if(errWriteFile) {
                  console.log(errWriteFile);
                  process.exit(1);
                } else {
                  var $ = cheerio.load(body);
                  var pronosPage = $("a.btnQuinte:contains('partants/stats/prono')").attr('href');
                  console.log("Get pronos page... " + baseUri + pronosPage+" to "+rawDir+'/pronos');
                  options.url = baseUri + pronosPage;
                  request(options).pipe(fs.createWriteStream(rawDir+'/pronos'));
                }
              });
            } else {
                console.log(JSON.stringify(resp));
            }
          });
      });
    } else {
      console.log(rawDir+'/pronos already exists');
    }
  }
});
