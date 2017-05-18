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
      
      collection.find().toArray(function(errFind, results) {
          //console.log('********** got results ****************');
          if(errFind) {
            console.error(errFind.message);
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
            var testLine=0
            var goodPronos = [ 
              //'statoturf' , 'quintenet' , 'confidencespros' , 'tiercemagazinecom' , 'beurfm' , 'sudouest' , 'aip' , 
              //'starafricacom' , 'rmc' , 'echofm' , 'agencedirectpresse' , 'marioputrino' , 'johangérard' , 'nicolaslabourasse' , 
              //'hubertdebruyne' , 'christophemeyer' , 'yanndaigneau' , 'franckpinchinat' , 'radiobalances' , 'actionsportive' , 
            'progres' , 'nicematin' , 'indépendant' , 'europe1' , 'confidencescourses' , 'rtl' , 'favori' , 'paristurfcom' , 'paristurf' , 'topjockeysdrivers' , 'topentraineurs' , 'bilto' , 'weekend' , 'tropicfm' , 'ouestfrance' , 'agencetip' , 'tiercemagazine' , 'dauphinelibere' , 'gazette' , 'pariscourses' , 'republicainlorrain' , 'parisien' ];
            //console.log(goodPronos.length)
            
            unifiedResults.forEach(function(result) {
                
                //console.log("creating line for "+result.date+" "+JSON.stringify(result));
                var myS = "";
                for(var i = 1; i <= result.nbPartants;i++){
                  //console.log("creating line horse "+i);
                  var arriveI=result.finish.indexOf(i);
                  if(arriveI===-1) myS="-1;";
                  else {
                    if(arriveI<=4) myS="1;";
                    else  myS="-1;";
                  }
                  if(!result.refCote[i]) {
                    // pas de cote pour ce cheval, on passe au cheval suivant
                    i=result.nbPartants+1;
                  } else {
                    if(result.refCote[i]<15) {
                      myS += "1;0;0;0;";
                    } else if (result.refCote[i]<30) {
                      myS += "0;1;0;0;";
                    } else if (result.refCote[i]<60) {
                      myS += "0;0;1;0;";
                    } else if (result.refCote[i]>=60) {
                      myS += "0;0;0;1;";
                    }
                    complete = true
                    for(var j = 0; j < goodPronos.length;j++) {
                      var goodProno = goodPronos[j];
                      if(!result.pronos[goodProno]) {
                        //console.log(goodProno+" is not there")
                        complete = false;
                        j=goodPronos.length+1;
                      } else {
                        //console.log(goodProno+": "+result.pronos[goodProno])
                        var pronI = result.pronos[goodProno].indexOf(i);
                        if(pronI<0) {
                          myS += "0;0;0;";
                        } else if(pronI<3) {
                          myS += "1;0;0;";
                        } else if (pronI<6) {
                          myS += "0;1;0;";
                        } else {
                          myS += "0;0;1;";
                        }
                      }
                    }
                    //console.log(result.date+"/"+new Date(result.date)+"/"+new Date(result.date).getDay())
                    if(complete) {
                      var day = new Date(result.date).getDay();
                      switch(day) {
                        case 0: myS+="1;0;0;0;0;0;0";break;
                        case 1: myS+="0;1;0;0;0;0;0";break;
                        case 2: myS+="0;0;1;0;0;0;0";break;
                        case 3: myS+="0;0;0;1;0;0;0";break;
                        case 4: myS+="0;0;0;0;1;0;0";break;
                        case 5: myS+="0;0;0;0;0;1;0";break;
                        case 6: myS+="0;0;0;0;0;0;1";break;
                      }
                      console.log(myS);
                      //+new Date(result.date).getDay()
                      //console.log(""+myS+((1/result.nbPartants).toFixed(3)));
                      testLine++  
                    } else i=result.nbPartants+1
                  }
                }
                
                //console.log("-------------------------"+testLine)
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

