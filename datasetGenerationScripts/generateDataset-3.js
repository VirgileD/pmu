var fs = require('fs'),
_ = require('underscore'),
mongodb = require('mongodb');

var unit = require("./lib/unitPro.js").unit;
var DBName = "pmu";
var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
var db = new mongodb.Db(DBName, server, {w: 1});
var trainFile = "/home/virgile/projects/pmu/testFiles/train-3.csv";

function writon(message) {
  process.stdout.write(message) 
}

db.open(function (errorDbOpen, dbclient) {
    if(errorDbOpen) {
      console.error(errorDbOpen.message);
      process.exit(2);
    } else {
      var collection = new mongodb.Collection(dbclient, 'courses1');
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
        if(errFind) {
          console.error(errFind);
          process.exit(2);
        } else {
          console.log('* '+results.length+' courses sélectionnées');
          var goodPronos = [ 
            //'statoturf' , 'quintenet' , 'confidencespros' , 'tiercemagazinecom' , 'beurfm' , 'sudouest' , 'aip' , 
            //'starafricacom' , 'rmc' , 'echofm' , 'agencedirectpresse' , 'marioputrino' , 'johangérard' , 'nicolaslabourasse' , 
            //'hubertdebruyne' , 'christophemeyer' , 'yanndaigneau' , 'franckpinchinat' , 'radiobalances' , 'actionsportive' , 
            //'progres' ,'nicematin' ,'indépendant' , 
            'europe1' , 
            //'confidencescourses' ,
            'rtl' , 
            //'favori' ,
            'paristurfcom' , 'paristurf' , 'topjockeysdrivers' , 'topentraineurs' , 'bilto' , 'weekend' , 'tropicfm' , 'ouestfrance' , 'agencetip' , 'tiercemagazine' , 'dauphinelibere' , 'gazette' , 'pariscourses' , 'republicainlorrain' , 'parisien' ];
          results.forEach(function(result) {
            writon("\ntraitement de la course "+result.date+" ("+result.nbPartants+")\r");
            for(var i = 1; i <= result.nbPartants&&result.finish;i++) {
              writon("traitement de la course "+result.date+": "+i+"/"+result.nbPartants+"\r");
              // ajout du numero du cheval (ne sera pas utilisé par le classifier)
              var myS = ""+i+";";
              var arriveI=result.finish.indexOf(i);
              
              // ajout de la target du classifier
              // 0 pour la classe des chevaux qui n'ont pas terminé dans les 3 premiers
              // et 1 pour les chevaux sur le podium
              if(arriveI===-1) myS+="0;";
              else {
                if(arriveI<=2)       {
                  myS+="1;";
                }
                else  myS+="0;";
              }
              // on vérifie qu'on a une cote valide pour ce cheval, sinon on passe au cheval suivant
              if(result.refCote[i]&& !isNaN(result.refCote[i])) {
                // ajout de la cote
                myS += ""+(1/result.refCote[i]).toFixed(4);
                // pour chaque pronostiqueur selectionné
                for(var j = 0; j < goodPronos.length;j++) {
                  var goodProno = goodPronos[j];
                  var pronI = result.pronos[goodProno].indexOf(i);
                  // on va ajouter 8 feature, correspondat chacune
                  // à la préence du cheval à la place
                  //par ex, si le chaval est donné 3eme par ce pronostiqueur on aura: 0;0;1;0;0;0;0;0
                  for(var num=0;num<8;num++) {
                    if(pronI==num) {
                      myS += ";1";
                    } else {
                      myS += ";0";
                    }
                  }
                }
                
                // on ajoute au fichier d'entrainement
                fs.appendFileSync(trainFile, myS+"\n");
              }
            }
          });
        }
      });
    }
});

