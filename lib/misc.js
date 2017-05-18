'use strict';
var conf = require("./conf");
var fs = require('fs'),
  _ = require('underscore'),
  mongodb = require('mongodb'),
  nodemailer = require("nodemailer");
var unit = require("./unitPro.js").unit;
 
var getGenyLogin = function getLogin() {
  var objLog = {};
  objLog.login=conf.geny.login;
  objLog.submit='Ok';
  objLog.memoriser='true';
  objLog.password=conf.geny.passw;
  console.dir(objLog);
  return objLog;
};

var sendReport = function sendReport(date, report) {
  const nodemailer = require('nodemailer');
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
      service: conf.mail.service,
      auth: {
          user: conf.mail.account,
      pass: conf.mail.pass
      }
  });
  // setup email data with unicode symbols
  let mailOptions = {
    from: conf.mail.from, // sender address
    to: conf.mail.to, // list of receivers
    subject: '['+date+'] '+conf.mail.subject, // Subject line
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
};

var dump = function dump(object, pad) {
  var indent = '\t';
  if (!pad) {
    pad = '';
  }
  var out = '';
  if (object.constructor === Array){
    out += '[ ';
    for (var i=0; i<object.length-1; i++){
        out += object[i]+', ';
    }
    out += object[object.length-1]+ ' ]';
  } else if (object.constructor === Object){
    out += '{\n';
    for (var field in object){
        out += pad + indent + field + ': ' + dump(object[field], pad + indent) + '\n';
    }
    out += pad + '}';
  }else{
    out += object;
  }
  return out;
};

function getToday(separator) {
    if(!separator) {
        separator="-";
    }
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    month = month<10 ? '0' + month : month;
    var date = today.getDate();
    date = date<10 ? '0' + date : date;
    //console.log('Yesterday: ' + date + '/' + month + '/' + year);
    return year + separator + month + separator + date;
}

var getDate = function getDate(separator) {
    if(!separator) {
        separator="-";
    }
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
    return year + separator + month + separator + date;
  }
};

var getRapportShortName = function getShortName(rapport) {
  var shortName = '';
  //console.log('----'+rapport);
  rapport.split(" ").forEach(function(elem) {
      shortName += elem.substr(0,1).toLowerCase();
      //console.log(elem+'----<<'+shortName);
  });
  return shortName;
};

var sanitizeProno = function sanitizeProno(prono) {
  var already = [];
  prono = _.map(prono, function(num) {
    var chev = parseInt(num, 10);
    if(isNaN(chev)||already.indexOf(chev)!==-1) {
      return 0;
    } else {
      already.push(chev);
      return chev;
    }
  });
  return prono;
};

var sanitizeKey = function sanitizeKey(key) {
    var newKey= key.replace(/\./gm,'_').toLowerCase();;
    if(!unit[newKey]) {
        console.log("Ignoring unknown forecaster: "+newKey +" ("+key+")");
        return "";
    } else {
        return unit[newKey]; 
    }
};

var getAmount = function getAmount(amountString) {
  amountString = amountString.replace(/\s+/gm,'').replace(/€/gm,'').replace(/,/gm,'.').toLowerCase();
  return parseFloat(amountString);
};

var insertPronos = function insertPronos(date, pronos, options) {
  date = parseInt(date.replace(/\-/g, ''),10);
  var server = new mongodb.Server(conf.mongo.host, 27017, {safe:true}, {strict: false});
  var db = new mongodb.Db(conf.mongo.db, server, {w: 1});
  db.open(function (errorDbOpen, client) {
    if(errorDbOpen) {
      console.error(errorDbOpen.message);
      process.exit(2);
    } else {
      var collection = client.collection(conf.mongo.collection);
      collection.find({date: date}).toArray(function(errFind, results) {
        if(errFind) {
          console.error(errFind.message);
          process.exit(2);
        } else {
          if(results.length===0) {
            options = options || {};
            _.extend(options, {date: date, pronos: pronos});
            collection.insert(options, {safe:true}, function(errorCollectionInsert) {
              if(errorCollectionInsert) {
                console.error(errorCollectionInsert.message);
                process.exit(2);
              } else {
                console.log('successfully inserted');
              }
              db.close();
            });
          } else {
            console.log('a record already exists for '+date);
            _.extend(results[0], options);
            if(results[0].pronos) {
              _.extend(results[0].pronos, pronos);
            } else {
              results[0].pronos = pronos;
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
};


var insertResults=function  insertResults(date, gains, arrivee) {
  date = parseInt(date.replace(/\-/g, ''),10);
  var server = new mongodb.Server(conf.mongo.host, 27017, {safe:true}, {strict: false});
  var db = new mongodb.Db(conf.mongo.db, server, {w: 1});
  db.open(function (errorDbOpen, client) {
    if(errorDbOpen) {
      console.error(errorDbOpen.message);
      process.exit(2);
    } else {
      var collection = client.collection(conf.mongo.collection);
      collection.update({date: date}, {$set: {finish: arrivee, gains: gains}}, {safe:true, upsert: true}, function(errorCollectionUpdate) {
        if(errorCollectionUpdate) {
          console.error(errorCollectionUpdate.message);
          process.exit(2);
        } else {
          console.log('Results successfully updated');
        }
        db.close();
      });
    }
  });
};

module.exports.getDate = getDate;
module.exports.getRapportShortName = getRapportShortName;
module.exports.sanitizeKey = sanitizeKey;
module.exports.sanitizeProno = sanitizeProno;
module.exports.getAmount = getAmount;
module.exports.insertPronos = insertPronos;
module.exports.insertResults = insertResults;
module.exports.dump = dump;
module.exports.sendReport = sendReport;
module.exports.getGenyLogin = getGenyLogin;
