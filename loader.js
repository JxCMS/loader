/**
 * main file for loader module
 *
 * Loader is used to concatenate javascript and css files for use on the browser. This is a
 * port of jxLoader's kohana module (sort of) as well as the base jxLoader class from PHP.
 */

/**
 * Dependencies
 */
var routes = require('./controllers/loader').routes,
    jxLoader = require('jxLoader/jxLoader'),
    baseConfig = require('./configs/base'),
    repoConfig = require('./configs/repos'),
    loader = null;

//use a closure so we don't pollute the global namespace
(function(){

//needs to have an init() method for setting up the module
exports.init = function(db, router){
    //load and intialize the loader controller
    //setup routing
    router.add(routes);

    //load and configure the loader itself
    loader = new jxLoader(baseConfig);
    loader.add(repoConfig);
    return true;
};


//also needs an activate method - used to activate the module after installation
exports.activate = function(){

};

//and a deactivate method - removes anything we added to make the module not work anymore
exports.deactivate = function(){

    //call deinit
    deinit();
};

exports.addRepo = function(config) {
    loader.add(config);
};

/**
 * deinit undoes any initialization  (specifically the routing)
 */
function deinit() {

};

/**
 * From here down are specific functions that this module will need
 */


})();