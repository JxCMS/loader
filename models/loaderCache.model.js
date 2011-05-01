
var mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var cache = new Schema({
    key: {type: String, index: true, required: true},
    data: String

});

mongoose.model('loaderCache', cache);