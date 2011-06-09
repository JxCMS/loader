/**
 * Loader controller
 */

/**
 * Dependencies
 */

var Controller_Main = require('../../../system/controller').Controller_Main,
    Promise = require('promise').Promise,
    uuid = require('uuid');

//load in the cache model
require('../models/loaderCache.model');


(function(){

    var Controller = exports.Controller = new (new Class({

        Extends: Controller_Main,

        module: null,

        before: function(request, response) {
            var mode = request.getParam('mode','PROD').toUpperCase(),
                depsOnly = request.getParam('depsOnly',false);

            if (mode == 'DEV' && depsOnly) {
                request.setParam('format','json');
            } else {
                request.setParam('format','file');
            }
            return this.parent(request, response);
        },

        index_action: function(request, response) {
            var promise = new Promise(),
                view = response.view;
            
            //grab all needed variables

            //call into jxLoader
            var domain;
            if (request.domainIsAlias) {
                domain = request.aliasedDomain;
            } else {
                domain = request.domain;
            }
            var loader = this.module.getLoader(domain);
            //core.debug('Loader returned',loader);
            if (loader) {

                var mode = request.getParam('mode','PROD').toUpperCase(),
                    files = Array.from(request.getParam('file',[])),
                    repos = Array.from(request.getParam('repo', [])),
                    type = request.getParam('type','js'),
                    compress = request.getParam('compress',true),
                    algorithm = request.getParam('alg','jsmin'),
                    depsOnly = request.getParam('depsOnly',false),
                    opts = request.getParam('opts',false),
                    //clearCache = request.getParam('clearCache',false),
                    theme = request.getParam('theme',''),
                    allDeps = request.getParam('allDeps', false),
                    clearSession = request.getParam('clearSession', false),
                    page = request.getParam('page',''),
                    key = request.getParam('key',''),
                    isLoader = false,
                    included = null,
                    db = request.domainObj.getDbOptions(request.domain);

                core.debug('Type to load',type);
                core.debug('files requested', files);
                core.debug('repos requested',repos);
                

                if (nil(page) || page=='') {
                    page = uuid();
                }

                var dbkey = page + '-' + type;
                core.debug('DB Key', dbkey);

                var Cache = db.model('loaderCache');
                Cache.find({key: dbkey},[],{limit: 1},function(err, docs){
                    if (err) {
                        //handle error
                        core.debug('!!!Error from Cache.find()', err);
                        throw err;
                    }
                    core.debug('docs returned by cache',docs);
                    var doc;
                    if (docs.length > 0) {
                        doc = docs[0];
                        if (doc.data !== '') {
                            included = Array.from(JSON.parse(doc.data));
                        } else {
                            included = [];
                        }
                    } else {
                        doc = new Cache();
                        doc.key = dbkey;
                        included = [];
                    }

                    if (files.length >= 1 && files.contains('loader')) {
                        mode = 'PROD';
                        isLoader = true;
                    }

                    //unset session
                    if (clearSession) {
                        included = [];
                        var dbk = page + '-js';
                        Cache.find({key: dbk}, [], function(err, docs){
                            if (err) {
                                //handle error
                                core.debug('!!!error from finding cached js to clear',err);
                            }
                            if (docs.length > 0) {
                                docs[0].data = '';
                                docs[0].save();
                            }
                        });


                        dbk = page + '-css';
                        Cache.find({key: dbk}, [], function(err, doc){
                            if (err) {
                                //handle error
                                core.debug('!!!error from finding cached css to clear',err);
                            }
                            if (docs.length > 0) {
                                docs[0].data = '';
                                docs[0].save();
                            }
                        });

                    }

                    core.debug('classes included last time', included);

                    if (mode == 'DEV') {

                        //get exclude list...
                        var exclude = included;

                        //in development mode
                        if (depsOnly) {
                            var deps = loader.compileDeps(files, repos, 'jsdeps', opts, exclude);
                            core.debug('Deps returned in DEV & depsOnly',deps);
                            //setup deps properly
                            var d = [];
                            flat = loader.getFlatArray();
                            deps.each(function(dep){
                                var css = !nil(flat[dep]['css']) && ((flat[dep]['css']).length > 0);
                                d.push(dep + ':' + css);
                            },this)
                            //send back as json... this would have been called to get deps by loader.js

                            view.set('deps', d);
                            view.set('key', key);
                            doc.set('data', JSON.stringify(deps));
                            doc.set('key', dbkey);
                            core.debug('Data saved after compile in loader',doc.data);
                            doc.save();
                        } else {
                            var ret = loader.compile(files, repos, type, false, theme, exclude, opts);
                            if (ret) {
                                var source = ret.source;
                                var incl = exclude.combine(ret.included);

                                doc.set('data', JSON.stringify(deps));
                                doc.set('key', dbkey);
                                core.debug('Data saved after compile in loader',doc.data);
                                doc.save();
                                
                                view.set('content',source);
                                response.contentType(type);
                            }
                        }
                    } else {
                        //in production mode

                        //get exclude list...
                        var exclude;
                        if (!allDeps && !nil(included)) {
                            exclude = included;
                        } else {
                            exclude = [];
                        }
                        core.debug('excluded classes',exclude);
                        var ret = loader.compile(files, repos, type, true, theme, exclude, opts);
                        core.debug('returned from compile',ret.included);
                        var source = ret.source;
                        if (!nil(ret.included)) {
                            included = exclude.combine(ret.included);
                        } else {
                            included = exclude;
                        }
                        
                        core.debug('saved to exclude next time', included);
                        doc.set('data', JSON.stringify(included));
                        doc.set('key', dbkey);
                        core.debug('Data saved after compile in loader',doc.data);
                        doc.save();

                        if (nil(source) || source=='') {
                            source = "/* No source to return */";
                        } else if (isLoader) {
                            source = source.replace('%page%', page);
                        }
                        if (compress) {
                            if (type == 'js') {
                                //add compression here
                            } else {
                                //add css compression here
                            }
                        }

                        view.set('content', source);
                        view.setFileType(type);

                    }
                    promise.resolve('true');
                }.bind(this));

                
            } else {
                promise.reject('No loader available!');
            }
            return promise;
        },

        setModule: function(m) {
            this.module = m;
        }

    }))();

    exports.routes = [
        ['loader','GET /loader', null, Controller,{action: 'index'}]
    ];

})();