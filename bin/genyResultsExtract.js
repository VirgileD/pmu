var fs = require('fs'),
  cheerio = require('cheerio'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('extract geny results for: ' + date);

var baseDir = __dirname+'/../datas/';
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/geny";

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
  $("table#lesQuintos table").last().find('tr').each(function(index) {
    if(index!==0) { // not the first line
      var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      var rapport = $(this).find("td").eq(2).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      if(rapport!=='') {
          //console.log(misc.getRapportShortName("5 "+rapportName)+': '+misc.getAmount(rapport));
          gains[misc.getRapportShortName("5 "+rapportName)] = misc.getAmount(rapport);
      }
    }
  });
  //console.log('***');
  $("table#lesQuartos table").last().find('tr').each(function(index) {
    if(index!==0) { // not the first line
      var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      var rapport = $(this).find("td").eq(2).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      if(rapport!=='') {
        //console.log(misc.getRapportShortName("4 "+rapportName)+': '+misc.getAmount(rapport));
        gains[misc.getRapportShortName("4 "+rapportName)] = misc.getAmount(rapport);
      }
    }
  });
  //console.log('***');
  $("table#lesTierces table").last().find("tr").each(function(index) {
    if(index!==0) { // not the first line
      var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      var rapport = $(this).find("td").eq(1).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      if(rapport!=='') {
          //console.log(misc.getRapportShortName("3 "+rapportName)+': '+misc.getAmount(rapport));
          gains[misc.getRapportShortName("3 "+rapportName)] = misc.getAmount(rapport);
      }
    }
  });
  //console.log('***');
  $("table#lesMultis td:contains('PMU') table tr").each(function(index) {
    if(index!==0) { // not the first line
      //console.log($(this).text().replace(/\s/gm,''));
      var rapportName = $(this).find("td").eq(0).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      var rapport = $(this).find("td").eq(2).text().replace(/^\s*/gm,'').replace(/\s*$/gm,'').toLowerCase();
      if(rapport!=='') {
        //console.log(rapportName.split(" ").join("")+': '+misc.getAmount(rapport));
        gains[misc.getRapportShortName(rapportName)] = misc.getAmount(rapport);
      }
    }
  });
  misc.insertResults(date, gains, arrivee);
  console.log(misc.dump({ arrivee: arrivee, gains: gains }));
});

