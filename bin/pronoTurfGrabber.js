var request = require('request'),
  fs = require('fs'),
  jsdom = require('jsdom'),
  iconv = require('iconv'),
  mkdirp = require('mkdirp').mkdirp,
  misc = require('../lib/misc');

process.env.TZ = 'GMT';

var date = misc.getDate();
console.log('grab pronoturf pronos for: ' + date);

var baseDir = __dirname+'/../datas/';
var baseUri = "http://www.pronostics-turf.info/courses/archives.php";
var rawDir = baseDir + '/' + date.split('-')[0] + '/' + date.split('-')[1] + '/' + date.split('-')[2] + "/pronoTurf";
var data = "a&Confirne=OK&text="+ date.split('-')[2] + '/' + date.split('-')[1] + '/' + date.split('-')[0]

mkdirp(rawDir, 0777, function (errorMkdirp) {
    if (errorMkdirp) {
        console.error(errorMkdirp)
        process.exit(1);
    } else {
        if(!fs.existsSync(rawDir+'/pronos')) {
            console.log("Get pronos page... " + baseUri);
            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url: baseUri,
                body: data,
                encoding: 'binary'
            }, function (errRequest, resp, body) {
                if (!errRequest && resp.statusCode == 200) {
                    body = new Buffer(body, 'binary');
                    conv = new iconv.Iconv('iso-8859-1', 'utf8');
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

