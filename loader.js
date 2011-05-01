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
    modules = require('../../system/modules'),
    fs = require('fs'),
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
    
    //register media paths
    //watch for moduleInitDone event for media so we can add our media path
    var m = modules.isModuleReady('media', domain, true);
    core.debug('isModuleReady returned', m);
    if (m !== false) {
        m.registerPath(fs.realpathSync(__dirname + '/media/'));
    } else {
        var fn = function(module){
            var mod = modules.isModuleReady('media', domain, true);
            if (mod !== false) {
                mod.registerPath(fs.realpathSync(__dirname + '/media/'));
                core.removeEvent('moduleInitDone', fn);
            }
        };
        core.addEvent('moduleInitDone', fn);
    }
    return true;
};


/**
 * Other methods exposed for others to use go here
 */

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
};


/**
 * From here down are specific functions that this module will need
 */


})();