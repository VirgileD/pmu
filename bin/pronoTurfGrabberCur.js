'use strict';
var request = require('request').defaults(process.env.http_proxy ? { 'proxy': process.env.http_proxy }: {}),
  fs = require('fs'),
  iconv = require('iconv'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('grab pronoturf pronos for: ' + date);

var baseDir = __dirname+'/../datas/';
var baseUri = "http://www.pronostics-turf.info/fg-pronostics-presse.php";
var rawDir = baseDir+ '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] +'/pronoTurf';

mkdirp(rawDir,function (errorMkdirp) {
  if (errorMkdirp) {
    console.error(errorMkdirp);
    process.exit(1);
  } else {
    if(!fs.existsSync(rawDir+'/pronos')) {
      console.log("Get pronos page... " + baseUri);
      request.get({
        url: baseUri,
        encoding: 'binary'
      }, function (errRequest, resp, body) {
        if (!errRequest && resp.statusCode === 200) {
          body = new Buffer(body, 'binary');
          var conv = new iconv.Iconv('iso-8859-1', 'utf8');
          body = conv.convert(body).toString();
          fs.writeFile(rawDir+'/pronos', body ,function(errWriteFile) {
            if(errWriteFile) {
              console.log(errWriteFile);
              process.exit(1);
            }
          });
        } else {
          console.log(errRequest);
          process.exit(1);
        }
      });
    } else {
      console.log(rawDir+'/pronos already exists');
    }
  }
});

