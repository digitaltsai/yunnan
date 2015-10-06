var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var db = require('../db');

module.exports = function(app) {
  app.use(session({
    name: 'yunnan.sid',
    store: new MongoStore({ mongooseConnection: db.client }),
    resave: false,
    saveUninitialized: false,
    secret: 'keyboard cat'
  }));

}