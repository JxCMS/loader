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
    controller = require('./controllers/loader').controller,
    jxLoader = require('jxLoader/jxLoader').jxLoader,
    baseConfig = require('./configs/base').config,
    repoConfig = require('./configs/repos').config,
    loader = {};

//use a closure so we don't pollute the global namespace
(function(){

//needs to have an init() method for setting up the module
exports.init = function(db, router, domain){

    //setup routing
    router.add(routes);

    core.debug('baseConfig for ' + domain, baseConfig);
    core.debug('repoConfig for ' + domain, repoConfig);
    //load and configure the loader itself
    loader[domain] = new jxLoader(baseConfig);
    loader[domain].addRepository(repoConfig);

    core.debug('loader object after init',loader);

    //initialize the loader controller
    controller.setModule(exports);
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

exports.addRepository = function(config, domain) {
    loader[domain].addRepository(config, domain);
};


exports.getLoader = function (domain) {
    core.log('domain passed = ' + domain);
    core.debug('loader object in getLoader', loader);
    if (!nil(loader[domain])){
        return loader[domain];
    } else {
        return false;
    }
}
/**
 * deinit undoes any initialization  (specifically the routing)
 */
function deinit() {

};

/**
 * From here down are specific functions that this module will need
 */


})();