var express = require('express')
  , http = require('http')
  , path = require('path')
  , morgan = require('morgan')
  , errorHandler = require('errorhandler')
  , nodeOAuth = require('oauth')
  , session = require('express-session')
  , everyauth = require('everyauth');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
  app.use(everyauth.middleware());
  app.use(session({secret: 'keyboard cat'}));
}

var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

var oauth = new (nodeOAuth.OAuth)(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    'iaKtgB43i72C6jIKTZWFUb7R9',
    'mKXFlnvUjwhvlDdCUQTTP0WTqQ0CW1rAn59Lc4tLB7zcbmO9Tq',
    '1.0',
    'http://127.0.0.1:3000/auth/twitter/callback',
    'HMAC-SHA1'
);

app.get('/auth/twitter', function(req, res) {
    oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if(error) {
            res.send(error)
        } else {
          req.session.oauth = {'token' : oauth_token};
          console.log(req.session.oauth.token);
          req.session.oauth.token_secret = oauth_token_secret;
          console.log(oauth_token);
          res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
        }
    });
});

app.get('/auth/twitter/callback', function(req, res) {
    if(req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;

        oauth.getOAuthAccessToken(req.session.oauth.token, req.session.oauth.token_secret, req.session.oauth.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results) {
                if(error) {
                    res.send(error);
                } else {
                    req.session.oauth.access_token = oauth_access_token;
                    req.session.oauth.access_token_secret = oauth_access_token_secret;
                    req.session.user_profile = results;
                    res.redirect('/');
                }
            }
        );
    }
});
\
app.get('/signout', function(req, res) {
    delete req.session.oauth;
    delete req.session.user_profile;
    res.redirect('/');
});


