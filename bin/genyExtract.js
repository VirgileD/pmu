var request = require('request'),
  fs = require('fs'),
  jsdom = require('jsdom'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');
  
process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract geny pronos for: ' + date);

var baseDir = __dirname+'/..';
var baseUri = "http://www.geny.com/";
var summaryPage = "reunions-courses-pmu?date=";//2011-10-01
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/geny";

fs.readFile(rawDir+'/pronos', function(errReadFile,data){
  if(errReadFile) {
    console.error("Could not readFile file: %s", errReadFile);
    process.exit(1);
  }
  jsdom.env({ html: data, scripts: ['http://code.jquery.com/jquery-1.6.min.js']}, function(errJsDom, window){
    //Use jQuery just as in a regular HTML page
    var $ = window.jQuery;
    var location = ""+ $("div.nomReunion").first().text().toLowerCase();
    location = location.replace(/\s*/gm,'');
    location = location.split(':')[1];
    location = location.split('(')[0];
    console.log('location >'+location+'<');
    var name = $("div.nomCourse").first().text().split('-')[1].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
    console.log('name >'+name+'<');
    var nbPartants = $("div#dt_partants tr:last td:first").text();
    console.log('nbPartants >'+nbPartants+'<');
    var pronos = {};
    $("div#selectionsPresse table:first td").each(function(index) {
        if($(this).text().replace(/\s*/gm,'')!=='') {
            var name = $(this).find("div.phd").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
            var prono = $(this).find("div.pbd").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').split(/\s*-\s*/);
            if(prono.length===8) {
                pronos[misc.sanitizeKey(name)] = prono;
            } else {
                console.log('removing ' + name + ' prono with '+prono.length+' length');
            }
            //console.log(name+' :'+prono);
        }
    });
    $("div.redac").each(function(index) {
        var name = $(this).find("div.entete:first").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var prono = [];
        $(this).find("div.num").each(function(index) {
            prono.push($(this).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase());
        });
        if(prono.length===8) {
            pronos[misc.sanitizeKey(name)] = prono;
        } else {
            console.log('removing ' + name + ' prono with '+prono.length+' length');
        }
        //console.log(name+': '+prono);
    });
    misc.insertPronos(date, pronos);
    console.log(misc.dump(pronos));
  });
});

