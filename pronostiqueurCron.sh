#!/usr/bin/env sh


NODE=/home/virgile/nvm/v0.8.1/bin/node

if [  -n "$1" ]
then
    echo "process all for $1"
    logDate=`date +%Y-%m-%d--%H%M%S`-$1
    processDate=$1
else
    echo "process all for yesterday"
    logDate=`date +%Y-%m-%d--%H%M%S`
    processDate=''
fi

cd /home/virgile/workspace/pmu
$NODE ./bin/genyGrabber.js $1>> logs/grabber.$logDate.log
$NODE ./bin/pronoTurfGrabber.js $1>> logs/grabber.$logDate.log
$NODE ./bin/genyResultsGrabber.js $1>> logs/grabber.$logDate.log

$NODE ./bin/genyResultsExtract.js $1>> logs/grabber.$logDate.log
$NODE ./bin/genyExtract.js $1>> logs/grabber.$logDate.log
$NODE ./bin/pronoTurfExtract.js $1>> logs/grabber.$logDate.log

$NODE ./bin/sendReport.js logs/grabber.$logDate.log $logDate


