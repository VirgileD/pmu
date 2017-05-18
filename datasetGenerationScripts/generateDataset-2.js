var fs = require('fs'),
_ = require('underscore'),
mongodb = require('mongodb');

var unit = require("./lib/unitPro.js").unit;
//console.log(unit);
//process.exit(1);
var DBName = "pmu";
var count ={};

var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
var db = new mongodb.Db(DBName, server, {w: 1});
db.open(function (errorDbOpen, dbclient) {
    //console.log('********** got DB ****************');
    if(errorDbOpen) {
      console.error(errorDbOpen.message);
      process.exit(2);
    } else {
      var collection = new mongodb.Collection(dbclient, 'courses1');
      var unifiedResults = [];
      //console.log('********** got collection ****************');
      collection.find({ $and: [{ 'pronos.europe1': { $exists: true } },
{ 'pronos.rtl': { $exists: true } },
{ 'pronos.paristurfcom': { $exists: true } },
{ 'pronos.paristurf': { $exists: true } },
{ 'pronos.topjockeysdrivers': { $exists: true } },
{ 'pronos.topentraineurs': { $exists: true } },
{ 'pronos.bilto': { $exists: true } },
{ 'pronos.weekend': { $exists: true } },
{ 'pronos.tropicfm': { $exists: true } },
{ 'pronos.ouestfrance': { $exists: true } },
{ 'pronos.agencetip': { $exists: true } },
{ 'pronos.tiercemagazine': { $exists: true } },
{ 'pronos.dauphinelibere': { $exists: true } },
{ 'pronos.gazette': { $exists: true } },
{ 'pronos.pariscourses': { $exists: true } },
{ 'pronos.republicainlorrain': { $exists: true } },
{ 'pronos.parisien': { $exists: true } }] }).sort({date: -1}).toArray(function(errFind, results) {
          //console.log('********** got results: '+results.length+' ****************');
          if(errFind) {
            console.error(errFind);
            process.exit(2);
          } else {
            results.forEach(function(result) {
                //console.log('********** unifying '+result.date+'****************');
                delete result._id;
                uniPron = {};
                Object.keys(result.pronos).forEach(function(key) {
                    var prono = result.pronos[key];
                    if(!unit[key]) {
                      //console.log('in '+ result.date+' unknown key '+key);
                      uniPron[key] = prono;
                    } else {
                      //console.log('key: '+key +' / unitKey: '+unit[key]);
                      if(unit[key]&&uniPron[unit[key]]) {
                        //console.log('in '+ result.date+' '+key+' ecrase '+unit[key]);
                      } else {
                        uniPron[unit[key]] = prono;
                        if(count[unit[key]]) count[unit[key]] += 1;
                        else count[unit[key]] = 1;
                      }
                    }
                });
                result.pronos = uniPron;
                unifiedResults.push(result);
            });
            var goodPronos = [ 
              //'statoturf' , 'quintenet' , 'confidencespros' , 'tiercemagazinecom' , 'beurfm' , 'sudouest' , 'aip' , 
              //'starafricacom' , 'rmc' , 'echofm' , 'agencedirectpresse' , 'marioputrino' , 'johangérard' , 'nicolaslabourasse' , 
              //'hubertdebruyne' , 'christophemeyer' , 'yanndaigneau' , 'franckpinchinat' , 'radiobalances' , 'actionsportive' , 
            //'progres' ,
            //'nicematin' , 
            //'indépendant' , 
            'europe1' , 
            //'confidencescourses' ,
            'rtl' , 
            //'favori' ,
            'paristurfcom' , 'paristurf' , 'topjockeysdrivers' , 'topentraineurs' , 'bilto' , 'weekend' , 'tropicfm' , 'ouestfrance' , 'agencetip' , 'tiercemagazine' , 'dauphinelibere' , 'gazette' , 'pariscourses' , 'republicainlorrain' , 'parisien' ];
            //console.log('********** got unifiedResults: '+unifiedResults.length+' ****************');
            //console.log(goodPronos.length)
            var nbTest = 30;
            var trainFile = "/home/virgile/projects/pmu/train.csv";
            var testFile = "/home/virgile/projects/pmu/test";
            unifiedResults.forEach(function(result) {
                //console.log(result.date);
                for(var i = 1; i <= result.nbPartants&&result.finish;i++){
                  //console.log("creating line horse "+result.date+"/"+i+"/"+result.finish);
                  var myS = "\""+result.date+"\";"+i+";";
                  var arriveI=result.finish.indexOf(i);
                  
                  if(arriveI===-1) myS+="-1;";
                  else {
                    if(arriveI<=3)       {
                      myS+="1;";
                      //console.log(result.finish,"/",i,"/",result.finish.indexOf(i))
                    }
                    else  myS+="-1;";
                  }
                  if(!result.refCote[i]) {
                    // pas de cote pour ce cheval, on passe a la course suivante
                    if(nbTest>0&&i>1) fs.unlinkSync(testFile+nbTest+".csv");
                    i=result.nbPartants+1;
                    complete=false;
                    //console.log(result.date+"/cote "+i+": "+result.refCote[i]+" gone")
                  } else {
                    myS += ""+(1/result.refCote[i]).toFixed(4)+";";
                    complete = true
                    for(var j = 0; j < goodPronos.length;j++) {
                      var goodProno = goodPronos[j];
                      if(!result.pronos[goodProno]) {
                        //console.log(result.date+": "+goodProno+" is not there")
                        complete = false;
                        j=goodPronos.length+1;
                      } else {
                        //console.log(goodProno+": "+result.pronos[goodProno])
                        var pronI = result.pronos[goodProno].indexOf(i);
                        for(var num=0;num<8;num++) {
                          if(pronI==num) {
                            myS += "1;";
                          } else {
                            myS += "0;";
                          }
                        }
                      }
                    }
                    //console.log(result.date+"/"+new Date(result.date)+"/"+new Date(result.date).getDay())
                    if(complete) {
                      var day = new Date(result.date).getDay();
                      switch(day) {
                        case 0: myS+="1;0;0;0;0;0;0\n";break;
                        case 1: myS+="0;1;0;0;0;0;0\n";break;
                        case 2: myS+="0;0;1;0;0;0;0\n";break;
                        case 3: myS+="0;0;0;1;0;0;0\n";break;
                        case 4: myS+="0;0;0;0;1;0;0\n";break;
                        case 5: myS+="0;0;0;0;0;1;0\n";break;
                        case 6: myS+="0;0;0;0;0;0;1\n";break;
                      }
                      //console.log(result.date);
                      
                      //+new Date(result.date).getDay()
                      //console.log(""+myS+((1/result.nbPartants).toFixed(3)));
                      if(nbTest>0) fs.appendFileSync(testFile+nbTest+".csv", myS);
                      else {
                        //console.log('add to train file')
                        fs.appendFileSync(trainFile, myS);
                      }
                      if(i==result.nbPartants) {
                        nbTest--;
                        //console.log("change file")
                      }
                    } else i=result.nbPartants+1
                  }
                }
            });
            //console.log("-------------------------"+testLine)
            
            /*
            var collection2 = new mongodb.Collection(dbclient, 'courses');
            collection2.insert(unifiedResults, function(errorCollectionInsert) {
            if(errorCollectionInsert) {
            console.error(errorCollectionInsert.message);
            process.exit(2);
            } else {
            console.log('**********'+unifiedResults.length+' inserted ****************');
            db.close();
            }
            });
            */
          }
      });
    }
});

