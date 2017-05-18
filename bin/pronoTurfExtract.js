'use strict';
var fs = require('fs'),
  cheerio = require('cheerio'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc'),
  _ = require('underscore');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract pronoturf pronos for: ' + date);

var baseDir = __dirname+'/../datas/';
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/pronoTurf";

if (!fs.existsSync(rawDir+'/../UNAVAILABLE')&&!fs.existsSync(rawDir+'/../CANCELED')) {
  fs.readFile(rawDir+'/pronos', function(errReadFile,data){
    if(errReadFile) {
      console.error("Could not readFile file: %s", errReadFile);
      process.exit(1);
    }
    var $ = cheerio.load(data);
    var pronos = {};
    $("span.style135").last().find('p').each(function(index) {     
      var name = $(this).text().split(':')[0].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      if(name.length>0) {
        if(!/^les plus cit/.test(name)&&!/^chevaux \[valeur/.test(name)) {
          name = misc.sanitizeKey(name);
          if(name.length>0) {
            var prono = $(this).text().split(':')[1].replace(/\s*/gm,'').split('-');
            prono=misc.sanitizeProno(prono);
            if(prono.length===8&&prono.indexOf(0)===-1) {
              pronos[name] = prono;
            } else {
              console.log('removing ' + name + ' prono: '+prono);
            }
          }
        }
      }
    });
    misc.insertPronos(date, pronos);
    console.log(misc.dump(pronos));
  });
}

