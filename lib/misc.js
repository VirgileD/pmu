var fs = require('fs'),
  _ = require('underscore'),
  mongodb = require('mongodb'),
  nodemailer = require("nodemailer");

var sendReport = function sendReport(date, report) {
    var conf = require("./conf");
    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: conf.mailService,
        auth: {
            user: conf.mailAccount,
            pass: conf.mailPass
        }
    });

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: conf.mailFrom, // sender address
        to: conf.mailTo, // list of receivers
        subject: '['+date+'] '+conf.mailSubject, // Subject line
        text: report, // plaintext body
        html: "" // html body
    };

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log("Message sent: " + response.message);
        }

        // if you don't want to use this transport object anymore, uncomment following line
        smtpTransport.close(); // shut down the connection pool, no more messages
    });
}
var dump = function dump(object, pad) {
    var indent = '\t';
    if (!pad) pad = '';
    var out = '';
    if (object.constructor == Array){
        out += '[ ';
        for (var i=0; i<object.length-1; i++){
            out += object[i]+', ';
        }
        out += object[object.length-1]+ ' ]';
    } else if (object.constructor == Object){
        out += '{\n';
        for (var i in object){
            out += pad + indent + i + ': ' + dump(object[i], pad + indent) + '\n';
        }
        out += pad + '}';
    }else{
        out += object;
    }
    return out;
}

var getDate = function getDate() {
    if(/\d{4}-\d{2}-\d{2}/.test(process.argv[2])) {
        return process.argv[2];
    } else {
        var yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        var year = yesterday.getFullYear();
        var month = yesterday.getMonth() + 1;
        month = month<10 ? '0' + month : month;
        var date = yesterday.getDate();
        date = date<10 ? '0' + date : date;
        //console.log('Yesterday: ' + date + '/' + month + '/' + year);
        return year + '-' + month + '-' + date;
    }
}

var getRapportShortName = function getShortName(rapport) {
    var shortName = '';
    rapport.split(" ").forEach(function(elem) {
        shortName += elem.substr(0,1).toLowerCase();
    });
    return shortName;
}


var sanitizeKey = function sanitizeKey(key) {
    return key.replace(/\./gm,'_').toLowerCase();
}

var getAmount = function getAmount(amountString) {
    amountString = amountString.replace(/\s+/gm,'').replace(/€/gm,'').replace(/,/gm,'.').toLowerCase();
    return parseFloat(amountString);
}

var insertPronos = function insertPronos(date, pronos) {
    var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
    var db = new mongodb.Db('pmu', server, {w: 1});
    db.open(function (errorDbOpen, client) {
        if(errorDbOpen) {
            console.error(errorDbOpen.message);
            process.exit(2);
        } else {
            var collection = new mongodb.Collection(client, 'courses');
            collection.find({date: date}).toArray(function(errFind, results) {
                if(errFind) {
                    console.error(errorFind.message);
                    process.exit(2);
                } else {
                    if(results.length===0) {
                        collection.insert({date: date, pronos: pronos}, {safe:true}, function(errorCollectionInsert) {
                            if(errorCollectionInsert) {
                                console.error(errorCollectionInsert.message);
                                process.exit(2);
                            } else {
                                console.log('successfully updated');
                            }
                            db.close();
                        });
                    } else {
                        console.log('a record already exists for '+date);
                        if(results[0].pronos) {
                            _.extend(results[0].pronos, pronos);
                        } else {
                            results[0].pronos = pronos
                        }
                        collection.update({date: date}, results[0], {safe:true}, function(errorCollectionUpdate) {
                            if(errorCollectionUpdate) {
                                console.error(errorCollectionUpdate.message);
                                process.exit(2);
                            } else {
                                console.log('successfully updated');
                            }
                            db.close();
                        });
                    }
                }
            });
        }
    });
}


var insertResults=function  insertResults(date, gains, arrivee) {
    var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
    var db = new mongodb.Db('pmu', server, {w: 1});
    db.open(function (errorDbOpen, client) {
        if(errorDbOpen) {
            console.error(errorDbOpen.message);
            process.exit(2);
        } else {
            var collection = new mongodb.Collection(client, 'courses');
            collection.update({date: date}, {$set: {finish: arrivee, gains: gains}}, {safe:true, upsert: true}, function(errorCollectionUpdate) {
                if(errorCollectionUpdate) {
                    console.error(errorCollectionUpdate.message);
                    process.exit(2);
                } else {
                    console.log('successfully updated');
                }
                db.close();
            });
        }
    });
}

module.exports.getDate = getDate;
module.exports.getRapportShortName = getRapportShortName;
module.exports.sanitizeKey = sanitizeKey;
module.exports.getAmount = getAmount;
module.exports.insertPronos = insertPronos;
module.exports.insertResults = insertResults;
module.exports.dump = dump;
module.exports.sendReport = sendReport;
