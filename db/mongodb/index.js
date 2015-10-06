var config = require('../../config').db.mongodb;

var mongoose = require('mongoose');

var connectUrl = 'mongodb://' +
                    config.username + (config.password ? ':' + config.password + '@' : '') + // username/pw
                    config.host + ':' + config.port + // host/port
                    '/' + config.database; // database
mongoose.connect(config.mongoLabUrl || connectUrl);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log('yay');
});

var keyValueSchema = mongoose.Schema({
  key: String,
  value: String
});

var KeyValue = mongoose.model('KeyValue', keyValueSchema);

module.exports = {
  get: function(key, callback) {
    KeyValue.findOne({key: key}, function(err, keyValue) {
      // console.log('get', key, keyValue)
      if (keyValue) {
        return callback(err, JSON.parse(keyValue.value));
      }
      
      callback(err);
    });
  },

  set: function(key, value, callback) {
    // console.log('setting', key, value);

    var strValue = JSON.stringify(value);
    KeyValue.find({key: key}).remove(function(err, what) {
      if (err) {
        return callback(err);
      }

      // console.log('set', key, strValue);
      new KeyValue({key: key, value: strValue}).save(function(err) {
        if (callback) {
          return callback(err, value);
        }
      })
    });
  },

  list: function(filter, callback) {
    // console.log('listing', filter)
    KeyValue.find({}).sort({date: 'asc'}).exec(function(err, keyValue) {
      if (err || !keyValue) {
        return callback(err, keyValue);
      }

      var filtered = [];
      for (var i = 0; i < keyValue.length; i++) {
        if (keyValue[i].key.indexOf(filter) !== -1) {
          filtered.push(keyValue[i]);
        }
      }
      
      callback(null, filtered);
    });
  },

  client: mongoose.connection
}