var misc = require("../lib/misc"),
      fs = require('fs');


fs.readFile(process.argv[2], 'utf8', function (err,data) {
  if (err) {
    return misc.sendReport(err);
  }
  return misc.sendReport(data);
});
