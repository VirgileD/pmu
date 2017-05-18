#!/bin/bash

START=`echo $1 | tr -d -`;
mydate=$1;
while [ "$mydate" != "$2" ]
do
  ./pronostiqueurCron.sh $mydate
  mydate=`echo $mydate | tr -d -`;
  mydate="`date --date="$mydate +1 day" +%Y-%m-%d`";
done
