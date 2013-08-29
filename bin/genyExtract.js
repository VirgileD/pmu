var request = require('request'),
  fs = require('fs'),
  cheerio = require('cheerio'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc'),
  _ = require('underscore');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract geny pronos for: ' + date);

var baseDir = __dirname+'/../datas/';
var baseUri = "http://www.geny.com/";
var summaryPage = "reunions-courses-pmu?date=";//2011-10-01
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/geny";

fs.readFile(rawDir+'/pronos', function(errReadFile,data){
  if(errReadFile) {
    console.error("Could not readFile file: %s", errReadFile);
    process.exit(1);
  }
  var $ = cheerio.load(data);
  var location = ""+ $("div.nomReunion").first().text().toLowerCase();
  location = location.replace(/\s*/gm,'');
  location = location.split(':')[1];
  location = location.split('(')[0];
  console.log('location >'+location+'<');
  var name = $("div.nomCourse").first().text().split('-')[1].replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
  console.log('name >'+name+'<');
  var nbPartants = $("div#dt_partants").find('tr').last().find('td').first().text();
  console.log('nbPartants >'+nbPartants+'<');
  var statsChev = {};
  $("table#tableau_partants tbody").find('tr').each(function(index) {
    var chev = $(this).find('td').first().text();
    var domObj=$(this).find('td').last();
    var lastCote=parseFloat(domObj.text());
    domObj=domObj.prev();
    var refCote=parseFloat(domObj.text());
    domObj=domObj.prev();
    var valeur=parseFloat(domObj.text());
    statsChev[chev] = { lastCote: lastCote, refCote: refCote, valeur: valeur };
  });
  console.log(misc.dump(statsChev));
  var pronos = {};
  $("div#selectionsPresse table").first().find('td').each(function(index) {
      if($(this).text().replace(/\s*/gm,'')!=='') {
          var name = $(this).find("div.phd").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
          var prono = $(this).find("div.pbd").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').split(/\s*-\s*/);
          prono=misc.sanitizeProno(prono);
          if(prono.length===8&&prono.indexOf(0)===-1) {
              pronos[misc.sanitizeKey(name)] = prono;
          } else {
              console.log('removing ' + name + ' prono: '+pronos[misc.sanitizeKey(name)]);
          }
          //console.log(name+' :'+prono);
      }
  });
  $("div.redac").each(function(index) {
      var name = $(this).find("div.entete").first().text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      var prono = [];
      $(this).find("div.num").each(function(index) {
          prono.push($(this).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase());
      });
      prono=misc.sanitizeProno(prono);
      if(prono.length===8&&prono.indexOf(0)===-1) {
          pronos[misc.sanitizeKey(name)] = prono;
      } else {
          console.log('removing ' + name + ' prono with '+prono.length+' length');
      }
      //console.log(name+': '+prono);
  });
  misc.insertPronos(date, pronos, { statsChev: statsChev, name: name, nbPartants: nbPartants, location: location});
  console.log(misc.dump(pronos));
});

