var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var db = require('../db');
var config = require('../config');

module.exports = function(app) {
  app.use(session({
    name: config.session.name,
    store: new MongoStore({ mongooseConnection: db.client }),
    resave: false,
    saveUninitialized: false,
    secret: 'keyboard cat'
  }));

}