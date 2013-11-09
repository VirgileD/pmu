var fs = require('fs'),
  _ = require('underscore'),
  mongodb = require('mongodb');


function getToday(separator) {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    month = month<10 ? '0' + month : month;
    var date = today.getDate();
    date = date<10 ? '0' + date : date;
    //console.log('Yesterday: ' + date + '/' + month + '/' + year);
    return year + separator + month + separator + date;
}

function getCurPronos(date) {
    var path=__dirname+'/../public/images/'+date+'/pronoTurf/';
    var fileArray=_.filter(fs.readdirSync(path), function(file) { return /.*\.gif/.test(file);});
    return fileArray;
    
};


exports.index = function(req, res){
    console.log('>>>> in index '+req.query.date);
    var date = getToday('/');
    if(req.query.date) {
        date = req.query.date;
    }
    var date1 = date.replace(/\//g, "-");
    var path='/images/'+date+'/pronoTurf/';
    res.render('index', { path:path, imgArray: getCurPronos(date), date: date1, title: 'Express' });
};

exports.setimages = function(req, res) {
  var params=req.body;
  var date = getToday('-');
  if(params.date) {
      date = params.date;
  }
  console.log('>>>> in setimages '+date);
  var messages = [];
  console.dir(params);
  var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
  var db = new mongodb.Db('pmu', server, {w: 1});
  console.log('open db');
  db.open(function (errorDbOpen, client) {
    if(errorDbOpen) {
      console.log(errorDbOpen.message);
      messages.push(errorDbOpen.message);
      res.render('setimages', { messages:messages, title: 'Express' });
    } else {
      console.log('db opened');
      var collection = new mongodb.Collection(client, 'courses');
      console.log('searching '+date);
      collection.find({date: date}).toArray(function(errFind, results) {
        if(errFind) {
          console.log(errFind.message);
          messages.push(errFind.message);
          db.close();
          res.render('setimages', { messages:messages, title: 'Express' });
        } else {
          if(results.length===0||!results[0].pronos) {
              console.log("no pronostic for today");
              messages.push("no pronostic for today");
              db.close();
              res.render('setimages', { messages:messages, title: 'Express' });
          } else {
            messages.push('prono exist for '+date);
            console.log('prono exist for '+date);
            var pronos = {};
            Object.keys(results[0].pronos).forEach(function(key) {
              console.log('parsing prono: '+key+': '+results[0].pronos[key]);
              var arrPro = [];
              results[0].pronos[key].forEach(function(chev) {
                  //console.log('changing '+chev+' for '+params[chev]+'???');
                  if(params[chev]) {
                      //console.log('changing '+chev+' for '+params[chev]);
                      arrPro.push(parseInt(params[chev],10));
                  } else {
                      arrPro.push(chev);
                  }
              });
              pronos[key] = arrPro;
              console.log(key+': '+JSON.stringify(pronos[key]));
            });
            delete results[0].pronos;
            results[0].pronos = pronos;
            console.dir(results[0].pronos);
            console.log('updating');
            collection.update({date: date}, results[0], {safe:true}, function(errorCollectionUpdate) {
              if(errorCollectionUpdate) {
                messages.push(errorCollectionUpdate.message);
              } else {
                messages.push('successfully updated');
              }
              db.close();
              res.render('setimages', { messages:messages, result: results[0], title: 'Express' });  
            });
          }
        }
      });
    }
  });
};