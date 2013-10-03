var fs = require('fs'),
  cheerio = require('cheerio'),
  request = require('request').defaults(process.env.http_proxy ? { 'proxy': process.env.http_proxy }: {}),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc'),
  _ = require('underscore');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract pronoturf pronos for: ' + date);

var baseDir = __dirname+'/../datas/';
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + '/pronoTurf/';
var baseUri = "http://www.pronostics-turf.info/";

fs.readFile(rawDir+'pronos', function(errReadFile,data){
  if(errReadFile) {
    console.error("Could not readFile file: %s", errReadFile);
    process.exit(1);
  }
  var $ = cheerio.load(data);
  var pronos = {};
  //<img src="g/PRONOTICS-TURF.gif" width="363" height="11" border="0">
  $("img[src$='g\/PRONOTICS-TURF.gif']").each(function(index) {
    var name = '';
    $(this).prev('table').find('th').each(function(indexProno) {
      if(indexProno==0) {
        name = $(this).text().split(':')[0].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        pronos[name] = [];
      } else {
        var imgPath = $(this).find('img').attr('src');
        var imgFilename = imgPath.split('=')[1];
        pronos[name].push(imgFilename);
        //http://www.pronostics-turf.info/access_MySql.php?n=2459
        //
        if(!fs.existsSync(rawDir+'/'+imgFilename + '.gif')) {
          request.get(baseUri + imgPath).pipe(fs.createWriteStream(rawDir+'/'+imgFilename + '.gif'));
        } else {
          //console.log(baseUri + imgPath + ' already fetched to '+rawDir+'/'+imgFilename + '.gif');
        }
      }
    });
  });
  //misc.insertPronos(date, pronos);
  console.log(misc.dump(pronos));
});

