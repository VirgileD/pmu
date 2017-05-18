'use strict';
var fs = require('fs'),
  cheerio = require('cheerio'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract geny results for: ' + date);

var baseDir = __dirname+'/../datas/';
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/geny";

if (!fs.existsSync(rawDir+'/../UNAVAILABLE')&&!fs.existsSync(rawDir+'/../CANCELED')) {
  fs.readFile(rawDir+'/rapports', function(errReadFile,data){
    if(errReadFile) {
      console.error("Could not readFile file: %s", errReadFile);
      process.exit(1);
    }
    var $ = cheerio.load(data);
    var arrivee = [];
    $("table#arrivees").first().find("tr").each(function(index) {
        if(index<=5&&index>=1) {
            var chev = $(this);
            arrivee.push(parseInt(chev.find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase(), 10));
        }
    });
    console.log("arrivee: " + arrivee);
    var gains = {};
    $("table#les2sur4 td:contains('PMU') table").first().find("tr").each(function(index) {
    if(index!==0) { // not the first line
        var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/^(\d*-)*\d*/gm,'').replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapportName!=''&&rapport!=='') {
            gains["2s4"] = misc.getAmount(rapport);
        }
      }
    });
    $("table#lesQuintos td:contains('PMU') table").first().find("tr").each(function(index) {
      if(index!==0) { // not the first line
        //.replace(/^\s*/gm,'') replace space at the beginning
        //.replace(/^(\d*-)*\d*/gm,'') replace l'arrivée quand elle est affichée devant, ce qui arrive quand deux chevaux arrivent en même temps
        // dans e cas là il y a plusieurs lignes, tant pis on ne garde que la dernière
        var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/^(\d*-)*\d*/gm,'').replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapportName!=''&&rapport!=='') {
            //console.log(misc.getRapportShortName("5 "+rapportName)+': '+misc.getAmount(rapport));
            gains[misc.getRapportShortName("5 "+rapportName)] = misc.getAmount(rapport);
        }
      }
    });
    //console.log('***');
    $("table#lesQuartos td:contains('PMU') table").first().find("tr").each(function(index) {
      if(index!==0) { // not the first line
        var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/^(\d*-)*\d*/gm,'').replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapportName!=''&&rapport!=='') {
          //console.log(misc.getRapportShortName("4 "+rapportName)+': '+misc.getAmount(rapport));
          gains[misc.getRapportShortName("4 "+rapportName)] = misc.getAmount(rapport);
        }
      }
    });
    //console.log('***');
    $("table#lesTierces td:contains('PMU') table").first().find("tr").each(function(index) {
      if(index!==0) { // not the first line
        var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/^(\d*-)*\d*/gm,'').replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapportName!=''&&rapport!=='') {
            //console.log(misc.getRapportShortName("3 "+rapportName)+': '+misc.getAmount(rapport));
            gains[misc.getRapportShortName("3 "+rapportName)] = misc.getAmount(rapport);
        }
      }
    });
    //console.log('***');
    $("table#lesMultis td:contains('PMU') table").first().find("tr").each(function(index) {
      if(index!==0) { // not the first line
        //console.log($(this).text().replace(/\s/gm,''));
        var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/^(\d*-)*\d*/gm,'').replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapportName!=''&&rapport!=='') {
          //console.log(rapportName.split(" ").join("")+': '+misc.getAmount(rapport));
          gains[misc.getRapportShortName(rapportName)] = misc.getAmount(rapport);
        }
      }
    });
    $("table#lesSolos td:contains('PMU') table").first().find("tr").each(function(index) {
      if(index!==0) { // not the first line
        //console.log($(this).text().replace(/\s/gm,''));
        var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/^(\d*-)*\d*/gm,'').replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapportName!=''&&rapport!=='') {
          if(rapportName=="gagnant") {
            gains["sg"] = misc.getAmount(rapport);
          } else {
            // placés
            if(gains["sp1"]) {
              if(gains["sp2"]) {
                gains["sp3"] = misc.getAmount(rapport);
              } else {
                gains["sp2"] = misc.getAmount(rapport);
              }
            } else {
              gains["sp1"] = misc.getAmount(rapport);
            }
          }
        }
      }
    });
    misc.insertResults(date, gains, arrivee);
    console.log(misc.dump({ arrivee: arrivee, gains: gains }));
  });
}  
