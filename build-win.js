const builder = require('electron-builder');

builder.build({
    config: {
        'appId': 'net.synerex.client',
        'win':{
            'target': {
                'target': 'nsis',
                'arch': [
                    'x64',
                    'ia32',
                ]
            }
        }
    }
});
