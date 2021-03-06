'use strict';



// Dependencies
//
var bodyParser        = require('body-parser');
var connectRoute      = require('connect-route');
var http              = require('http');
var ss                = require('socketstream');
require('./server/internals');



// Define a single-page client
ss.client.define('main', {
	view  : 'app.jade',
	css   : ['libs', 'app.styl'],
	code  : ['libs', 'app'],
	tmpl  : '*'
});



var api = require(__dirname + '/server/api');



ss.http.middleware.prepend(bodyParser.json());
ss.http.middleware.prepend(ss.http.connect.query());
ss.http.middleware.prepend(connectRoute(api));
ss.session.options.secret = ss.api.app.config.sessionSecret;



// Serve this client on the root URL
ss.http.route('/', function (req, res) {
	res.serveClient('main');
});



// Use redis for session store
ss.session.store.use('redis', ss.api.app.config.redis);



// Use redis for pubsub
ss.publish.transport.use('redis', ss.api.app.config.redis);



// Code Formatters
ss.client.formatters.add(require('ss-coffee'));
ss.client.formatters.add(require('ss-jade'));
ss.client.formatters.add(require('ss-stylus'));



// Use server-side compiled Hogan (Mustache) templates. Other engines available
ss.client.templateEngine.use(require('ss-hogan'));



// Minimize and pack assets if you type: SS_PACK=1 SS_ENV=production node app.js
if (ss.env === 'production') { ss.client.packAssets(ss.api.app.config.packAssets); }



// Start SocketStream
var server = http.Server(ss.http.middleware);
server.listen(ss.api.app.config.port);
ss.start(server);

// So that the process never dies
process.on('uncaughtException', function (err) {
	console.error('Exception caught: ', err);
});