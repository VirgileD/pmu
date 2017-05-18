'use strict';
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

if (!fs.existsSync(rawDir+'/../UNAVAILABLE')&&!fs.existsSync(rawDir+'/../CANCELED')) {
  fs.readFile(rawDir+'pronos', function(errReadFile,data){
    if(errReadFile) {
      console.error("Could not readFile file: %s", errReadFile);
      process.exit(1);
    }
    var $ = cheerio.load(data);
    var pronos = {};
    var isImages = $('img[src*="prono-presse.php?n="]');
    //console.dir(isImages);
    if(isImages.length>0) {
        console.error("reading pronos with images, please proceed to http://82.225.60.223:3000?date="+slashDate);
        //<img src="g/PRONOTICS-TURF.gif" width="363" height="11" border="0">
        var images = $("img[src$='g\/PRONOTICS-TURF.gif']");
        var imLength = images.length;
        images.each(function(index) {
          var name = '';
          $(this).prev('table').find('th').each(function(indexProno) {
            if(indexProno==0) {
              name = $(this).text().split(':')[0].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
              name = misc.sanitizeKey(name);
              pronos[name] = [];
              imLength--;
              if(imLength===0) {
                misc.insertPronos(date, pronos);
              }
            } else {
              var imgPath = $(this).find('img').attr('src');
              if(imgPath) {
                  var imgFilename = imgPath.split('=')[1];
                  pronos[name].push(imgFilename);
                  
                  if(!fs.existsSync(rawDirWeb+'/'+imgFilename + '.gif')) {
                    var ws = fs.createWriteStream(rawDirWeb+'/'+imgFilename + '.gif');
                    ws.on('error', function(err) { console.log(err); });
                    request.get(baseUri + imgPath).pipe(ws);
                    imLength--;
                    if(imLength===0) {
                        misc.insertPronos(date, pronos);
                    }
                  } else {
                    //console.log(baseUri + imgPath + ' already fetched to '+rawDirWeb+'/'+imgFilename + '.gif');
                    imLength--;
                    if(imLength===0) {
                        misc.insertPronos(date, pronos);
                    }
                  }
              } else {
                  console.error("reading pronos with images but imgPath is null ("+name+': '+$(this).text()+")");
              }
            }
          });
        });
      } else {
          console.error("reading pronos with text");
          $('div:contains(PRONOSTICS DE LA PRESSE)').find('table').each(function(indexProno) {
            var thisProno = $(this).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
            if(thisProno==='') {
                console.log('found an empty prono');
                return false;
            } else {
                var re = /.{3,65}[^:]+:[^\d]+\d+[^\d]+\d+[^\d]+\d+[^\d]+\d+[^\d]+\d+[^\d]+\d+[^\d]+\d+[^\d]+\d+/;
                //turf magazine                       :   1   4   2   9   3   12   8   13 
                if(!re.test(thisProno)) {
                  console.error(thisProno+ ' does not respect prono regexp');  
                } else {
                  name = thisProno.split(':')[0].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
                  name= misc.sanitizeKey(name);
                  var prono = [];
                  thisProno.split(':')[1].replace(/^\s*/gm,'').replace(/\s*$/gm,'').replace(/[^\d\s]/gm,'').split(/\s+/).forEach(function(chev) {
                    prono.push(chev);
                  });
                  //console.log(prono)
                  pronos[name]=misc.sanitizeProno(prono);
                  //console.log(pronos[name])
                  console.error(name+':'+pronos[name]);
                }
            }
          });
          console.error('insert pronos('+date+'): '+JSON.stringify(pronos));
          misc.insertPronos(date, pronos);
      }
    //misc.insertPronos(date, pronos);
    //console.log("http://82.225.60.223:3000?date=2013/10/23");
    //console.log(misc.dump(pronos));
  });
}

