var fs = require('fs'),
_ = require('underscore'),
mongodb = require('mongodb');

var DBName = "pmu";
var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
var db = new mongodb.Db(DBName, server, {w: 1});
var trainFile = "/home/virgile/projects/pmu/testFiles/train-fann2-18.csv";

function writon(message) {
  process.stdout.write(message) 
}
var fs = require('fs'),
_ = require('underscore'),
mongodb = require('mongodb');

var DBName = "pmu";
var server = new mongodb.Server("127.0.0.1", 27017, {safe:true}, {strict: false});
var db = new mongodb.Db(DBName, server, {w: 1});
                                                       
function writon(message) {
  process.stdout.write(message) 
}

nbParts=process.argv[2]
nbTests=process.argv[3]

var trainFile = "/home/virgile/projects/pmu/testFiles/train-fann2-"+nbParts+".dat";
var testFile = "/home/virgile/projects/pmu/testFiles/test-fann2-"+nbParts+".dat";

if(fs.existsSync(trainFile)) fs.unlinkSync(trainFile)
db.open(function (errorDbOpen, dbclient) {
    if(errorDbOpen) {
      console.error(errorDbOpen.message);
      process.exit(2);
    } else {
      var collection = new mongodb.Collection(dbclient, 'courses1');
      collection.find({ $and: [{ 'nbPartants': +nbParts },
      { 'pronos.europe1': { $exists: true } },
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
          writon("* "+results.length+" courses sélectionnées\n");
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
          resultTreated=0
          nbTest=0
          nbTrain=0
          inTestFile=""
          inTrainFile=""
          results.forEach(function(result) {
            resultTreated++;
            writon("\ntraitement de la course "+result.date+" ("+result.nbPartants+")\n");
            if(result.finish) {
              input="";
              output="";
              for(var i = 1; i <= result.nbPartants;i++) {
                console.log("traitement de la course "+result.date+": "+i+"/"+result.nbPartants+"\r");
                // ajout du numero du cheval (ne sera pas utilisé par le classifier)
                var arriveI=result.finish.indexOf(i);
                // ajout de la target du classifier
                // 0 pour la classe des chevaux qui n'ont pas terminé dans les 3 premiers
                // et 1 pour les chevaux sur le podium
                if(arriveI===-1) output+="0 ";
                else {
                  if(arriveI<=3)       {
                    output+="1 ";
                  }
                  else  output+="0 ";
                }
                // ajout de la cote
                if(!result.refCote[i] || !isNaN(result.refCote[i])) result.refCote[i]=100;
                input+= ""+(1/result.refCote[i]).toFixed(6)+" ";
                // pour chaque pronostiqueur selectionné
                for(var j = 0; j < goodPronos.length;j++) {
                  var goodProno = goodPronos[j];
                  var pronI = result.pronos[goodProno].indexOf(i);
                  if(pronI<0) input+="0.0 ";
                  // on va ajouter 8 feature, correspondat chacune
                  // à la préence du cheval à la place
                  //par ex, si le chaval est donné 3eme par ce pronostiqueur on aura: (1-0.2)=> 0.8
                  else input += "0." + (9-pronI)+" ";
                }
              }
              console.log('1')
              if(nbTests>=0) {
                console.log('2')
                nbTest++;
                inTestFile+=input+"\n";
                inTestFile+=output+"\n";
              } else {
                console.log('3')
                nbTrain++
                inTrainFile+=input+"\n"
                inTrainFile+=output+"\n"
              }
              nbTests--
            }
            console.log('4')
            if(resultTreated==results.length) {
              console.log('5')
              // 17 pronostiqueurs et 1 cote par partant
              fs.appendFileSync(trainFile,""+nbTrain+" "+(18*nbParts)+" "+nbParts+"\n"+inTrainFile);
              fs.appendFileSync(testFile, ""+nbTest+" "+(18*nbParts)+" "+nbParts+"\n"+inTestFile);
            }
          });
        }
      });
    }
});

