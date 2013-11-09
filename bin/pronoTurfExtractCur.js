var fs = require('fs'),
  cheerio = require('cheerio'),
  request = require('request').defaults(process.env.http_proxy ? { 'proxy': process.env.http_proxy }: {}),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc'),
  _ = require('underscore');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract pronoturf pronos for: ' + date);

var baseDir = __dirname+'/../datas';
var slashDate = date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2];
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + '/pronoTurf/';
var rawDirWeb = '/home/virgile/workspace/pmu/set-images/public/images/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + '/pronoTurf';
var baseUri = "http://www.pronostics-turf.info/";

console.error("creating "+rawDirWeb);
mkdirp(rawDirWeb, 0777, function (errorMkdirp) {
    if (errorMkdirp) {
        console.error(errorMkdirp);
        process.exit(1);
    } else {
        console.error("reading "+rawDir+'pronos');
        fs.readFile(rawDir+'pronos', function(errReadFile,data){
          if(errReadFile) {
            console.error("Could not readFile file: %s", errReadFile);
            process.exit(1);
          }
          var $ = cheerio.load(data);
          var pronos = {};
          //<img src="g/PRONOTICS-TURF.gif" width="363" height="11" border="0">
          var images = $("img[src$='g\/PRONOTICS-TURF.gif']");
          var imLength = images.length;
          images.each(function(index) {
            var name = '';
            $(this).prev('table').find('th').each(function(indexProno) {
              if(indexProno==0) {
                name = $(this).text().split(':')[0].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
                pronos[name] = [];
                console.error("reading prono "+name);
                imLength--;
                if(imLength===0) {
                      console.error(">>>>>>>>>>>>> http://82.225.60.223:3000?date="+slashDate);
                      misc.insertPronos(date, pronos);
                  }
              } else {
                var imgPath = $(this).find('img').attr('src');
                var imgFilename = imgPath.split('=')[1];
                pronos[name].push(imgFilename);
                
                if(!fs.existsSync(rawDirWeb+'/'+imgFilename + '.gif')) {
                  console.error("requesting "+imgFilename);
                  var ws = fs.createWriteStream(rawDirWeb+'/'+imgFilename + '.gif');
                  ws.on('error', function(err) { console.log(err); });
                  request.get(baseUri + imgPath).pipe(ws);
                  imLength--;
                  if(imLength===0) {
                      console.error(">>>>>>>>>>>>> http://82.225.60.223:3000?date="+slashDate);
                      misc.insertPronos(date, pronos);
                  }
                } else {
                  //console.log(baseUri + imgPath + ' already fetched to '+rawDirWeb+'/'+imgFilename + '.gif');
                  imLength--;
                  if(imLength===0) {
                      console.error(">>>>>>>>>>>>> http://82.225.60.223:3000?date="+slashDate);
                      misc.insertPronos(date, pronos);
                  }
                }
              }
            });
          });
          //misc.insertPronos(date, pronos);
          //console.log("http://82.225.60.223:3000?date=2013/10/23");
          //console.log(misc.dump(pronos));
        });
    }
});

