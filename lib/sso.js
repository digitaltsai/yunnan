var config = require('../config');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2').Strategy;
var request = require('request');
var querystring = require('querystring');

// jwt stuff
var extend = require('util')._extend;
var jwt = require('jsonwebtoken');

passport.use(new OAuth2Strategy({
    authorizationURL: config.idServerUrl + '/oauth/authorize',
    tokenURL: config.idServerUrl + '/oauth/token',
    clientID: 'router',
    clientSecret: 'router_secret',
    callbackURL: config.callbackUrl + '/oauth/callback',
  },
  function(accessToken, refreshToken, profile, done) {
    jwt.verify(accessToken, config.accessToken.secret, function(err, decoded) {
      if (err) {
        return done(err);
      }
      console.log('jwt user', JSON.parse(decoded.user));
      done(null, JSON.parse(decoded.user));
    })
  }
));

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(user, done) {
  done(null, JSON.parse(user));
});

module.exports = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/oauth/callback', function(req, res, next) {
    passport.authenticate('oauth2', function(err, user, info) {
      if (err) {
        console.log('error', err);
        req.query.error = err;
        return;
      }

      req.login(user, function(err) {
        if (err) {
          console.log('login error', err);
          return next(err);
        }

        console.log('logged in', req.session);

        return res.redirect('/');
      });
    })(req, res, next);
  });


  return {
    ensureAuth: function(req, res, next) {
      if (!req.isAuthenticated()) {
        passport.authenticate('oauth2', {state: new Buffer(JSON.stringify({path: req.path})).toString('base64')})(req, res, next);  
      } else {
        next();
      }
    }
  }
}