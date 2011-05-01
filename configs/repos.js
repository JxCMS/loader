var fs = require('fs');

var jxLibPath = fs.realpathSync(__dirname + '/../media/jxlib/src');
core.debug('jxLibPath', jxLibPath);
exports.config = {
    'core': {
        'imageUrl': 'images/',
        'imageLocation': fs.realpathSync(__dirname + '/../media/images/'),
        'paths': {
            'js': fs.realpathSync(__dirname + '/../media/core/Source')
        }
    },
    'more': {
        'imageUrl': 'images/',
        'imageLocation': fs.realpathSync(__dirname + '/../media/images/'),
        'paths': {
            'js': fs.realpathSync(__dirname + '/../media/more/Source')
        }
    },
    'jxlib': {
        'imageUrl': 'images/',
        'imageLocation': fs.realpathSync(__dirname + '/../media/images/'),
        'paths': {
            'js': jxLibPath + '/Source',
            'css': jxLibPath + '/themes/{theme}/css',
            'cssalt': jxLibPath + '/themes/{theme}',
            'images': jxLibPath + '/themes/{theme}/images'
        }
    },
    'loader': {
        'paths': {
            'js': fs.realpathSync(__dirname + '/../media/loader/js')
        }
    }
};