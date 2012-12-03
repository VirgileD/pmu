#!/bin/sh

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

cd /home/virgiled/Documents/geek/workspace/pronostiqueurJs
node ./bin/genyGrabber.js $1>> grabber.$logDate.log
node ./bin/pronoTurfGrabber.js $1>> grabber.$logDate.log
node ./bin/genyResultsGrabber.js $1>> grabber.$logDate.log

node ./bin/genyResultsExtract.js $1>> grabber.$logDate.log
node ./bin/genyExtract.js $1>> grabber.$logDate.log
node ./bin/pronoTurfExtract.js $1>> grabber.$logDate.log

node ./bin/sendReport.js grabber.$logDate.log


