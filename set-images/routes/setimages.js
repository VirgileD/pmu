var fs = require('fs'),
_ = require('underscore');

exports.setimages = function(req, res){
    
    res.render('setimages', { reqImages:req, imgArray: getCurPronos(), title: 'Express' });
};