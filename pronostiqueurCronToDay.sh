#!/usr/bin/env sh


NODE=/home/virgile/nvm/v0.8.1/bin/node

logDate=`date +%Y-%m-%d`
echo $logDate

cd /home/virgile/workspace/pmu

$NODE ./bin/genyGrabber.js $logDate > logs/report.$logDate.txt 2>&1
$NODE ./bin/genyExtract.js $logDate >> logs/report.$logDate.txt 2>&1

$NODE ./bin/pronoTurfGrabberCur.js $logDate >> logs/report.$logDate.txt 2>&1
$NODE ./bin/pronoTurfExtractCur.js $logDate >> logs/report.$logDate.txt 2>&1

$NODE ./bin/sendReport.js logs/report.$logDate.txt $logDate


