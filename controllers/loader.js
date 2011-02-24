/**
 * Loader controller
 */

/**
 * Dependencies
 */

var Controller_Main = require('controller').Controller_Main,
    Promise = require('promise').Promise;


(function(){

    var Controller = exports.Controller = new Class({

        Extends: Controller_Main,

        index_action: function(request, response) {
            var promise = new Promise();
            
            core.log('In index_action() of loader controller');
            //load and return test.jazz
            this.view.setTemplate('test');

            core.debug('request has session in jxloader::index_action', !nil(request.session));
            core.debug('response has session in jxloader::index_action', !nil(response.session));

            response.session.set('test','some value');

            promise.resolve('true');
            return promise;
        }

    });

    exports.routes = [
        ['loader','GET /loader', null, new Controller(),{action: 'index'}]
    ]

})();