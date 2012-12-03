var request = require('request'),
  fs = require('fs'),
  jsdom = require('jsdom'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc'),
  _ = require('underscore');

process.env.TZ = 'GMT';

var date = misc.getDate();;
console.log('extract pronoturf pronos for: ' + date);

var baseDir = __dirname+'/../datas/';
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/pronoTurf";

fs.readFile(rawDir+'/pronos', function(errReadFile,data){
  if(errReadFile) {
    console.error("Could not readFile file: %s", errReadFile);
    process.exit(1);
  }
  jsdom.env({ html: data.toString(), scripts: ['http://code.jquery.com/jquery-1.6.min.js']}, function(errJsDom, window){
    //Use jQuery just as in a regular HTML page
    var $ = window.jQuery;
    var pronos = {};
    $("span.style135:last p:has(> strong)").each(function(index) {
        var name = $(this).text().split(':')[0].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(name!=='') {
            var prono = $(this).text().split(':')[1].replace(/\s*/gm,'').split('-');
            var isProno=true;
            prono.forEach(function(elem) {
                if(isNaN(elem)) {
                    isProno=false;
                }
            });
            if(isProno) {
                //console.log(name+": "+prono);
                if(!(/^les plus cit/.test(name) || /^chevaux \[valeur/.test(name))) {
                    if(prono.length===8) {    
                        pronos[misc.sanitizeKey(name)] = prono;
                    } else {
                        console.log('removing ' + name + ' prono with '+prono.length+' length');
                    }
                }
            }
        }
    });
    misc.insertPronos(date, pronos);
    console.log(misc.dump(pronos));
  });
});

