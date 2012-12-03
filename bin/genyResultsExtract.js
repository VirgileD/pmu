var request = require('request'),
  fs = require('fs'),
  jsdom = require('jsdom'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract geny results for: ' + date);

var baseDir = __dirname+'/..';
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/geny";

fs.readFile(rawDir+'/rapports', function(errReadFile,data){
  if(errReadFile) {
    console.error("Could not readFile file: %s", errReadFile);
    process.exit(1);
  }
  jsdom.env({ html: data, scripts: ['http://code.jquery.com/jquery-1.6.min.js']}, function(errJsDom, window){
    //Use jQuery just as in a regular HTML page
    var $ = window.jQuery;
    var arrivee = [];
    $("table#arrivees").first().find("tr").each(function(index) {
        if(index<=5&&index>=1) {
            var chev = $(this);
            arrivee.push(chev.find("td:eq(1)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase());
        }
    });
    console.log("arrivee: " + arrivee);
    var gains = {};
    $("table#lesQuintos table:last tr:gt(0)").each(function(index) {
        var rapportName = $(this).find("td:eq(0)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td:eq(2)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapport!=='') {
            //console.log(misc.getRapportShortName("5 "+rapportName)+': '+misc.getAmount(rapport));
            gains[misc.getRapportShortName("5 "+rapportName)] = misc.getAmount(rapport);
        }
    });
    //console.log('***');
    $("table#lesQuartos table:last tr:gt(0)").each(function(index) {
        var rapportName = $(this).find("td:eq(0)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td:eq(2)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapport!=='') {
            //console.log(misc.getRapportShortName("4 "+rapportName)+': '+misc.getAmount(rapport));
            gains[misc.getRapportShortName("4 "+rapportName)] = misc.getAmount(rapport);
        }
    });
    //console.log('***');
    $("table#lesTierces table:last tr:gt(0)").each(function(index) {
        var rapportName = $(this).find("td:eq(0)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td:eq(1)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapport!=='') {
            //console.log(misc.getRapportShortName("3 "+rapportName)+': '+misc.getAmount(rapport));
            gains[misc.getRapportShortName("3 "+rapportName)] = misc.getAmount(rapport);
        }
    });
    //console.log('***');
    $("table#lesMultis td:contains('PMU') table tr:gt(0)").each(function(index) {
        //console.log($(this).text().replace(/\s/gm,''));
        var rapportName = $(this).find("td:eq(0)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        var rapport = $(this).find("td:eq(2)").text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
        if(rapport!=='') {
            //console.log(rapportName.split(" ").join("")+': '+misc.getAmount(rapport));
            gains[misc.getRapportShortName(rapportName)] = misc.getAmount(rapport);
        }
    });
    misc.insertResults(date, gains, arrivee);
    console.log(misc.dump({ arrivee: arrivee, gains: gains }));
  });
});

