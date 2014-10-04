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
    'qjvqdx1FKtuqrP0FIrLPXP7UR',
    'U4r4Jv4K2LyQzFYDfs0KY3zFVt6TfJMK6bx8SI0MnIfh6xmyFl',
    '1.0A',
    'http://127.0.0.1:3000/auth/twitter/callback',
    'HMAC-SHA1'
);

var token = {
  token : ''
  , tokenSecret : ''
};


//auth/twitterにアクセスするとTwitterアプリケーション認証画面に遷移します。
app.get('/auth/twitter', function(req, res){
  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if (error) {
      console.log(error);
      res.send("yeah no. didn't work.");
    } else {
      req.session.oauth = {};
      req.session.oauth.token = oauth_token;
      console.log('oauth.token: ' + req.session.oauth.token);
      req.session.oauth.token_secret = oauth_token_secret;
      console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
    }
  });
});

app.get('/auth/twitter/callback', function(req, res, next){
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oa = req.session.oauth;
    oauth.getOAuthAccessToken(oa.token,oa.token_secret,oa.verifier,
    function(error, oauth_access_token, oauth_access_token_secret, results){
      if (error){
        console.log(error);
        res.send("yeah something broke.");
      } else {
        req.session.oauth.access_token = oauth_access_token;
        oa.accesstokenK = oauth_access_token;
        req.session.oauth.access_token_secret = oauth_access_token_secret;
        oa.accesstokenSec = oauth_access_token_secret;
        console.log(results);
        res.send("worked. nice one.");
      }
    });
    //そのユーザのtimelineからとってくること
    oauth.get(
      'https://api.twitter.com/1.1/statuses/user_timeline.json?user_id=337367293',
      oa.accesstokenK, //test user token
      oa.accesstokenSec, //test user secret
      function (e, data, res){
        if (e){} //console.error(e);
        //console.log(require('util').inspect(data));
        test = JSON.parse(data);
        var i = 0;
        var ary = [];
        while (i<10) {
          console.log(test[i].text);
          ary.push(test[i].text);
          i++;
        }
      });
  } else {
    next(new Error("you're not supposed to be here."));
  }
});



app.get('/signout', function(req, res) {
    delete req.session.oauth;
    delete req.session.user_profile;
    res.redirect('/');
});
