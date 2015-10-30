var db = require('../../db');
var config = require('../config');
var ws = require('../../lib/ws');

var Game = function(gameId, options) {
  var Player = function(color) {
    this.color = color;
    this.coins = 0;
    this.points = 0;
    this.freeBuildings = 0;
    this.buildings = {
      'teaHouse': 0,
      'tradingPost': 0,
      'bridge': 0
    },

    this.totalTraders = 3;
    this.horseLocation = 1;
    this.influence = 0;
    this.border = 2;

    this.freeMoves = 0;
    this.freeTraders = 3;
    this.roundPoints = 0;
    this.presents = 0;

    this.passAuction = true;
    this.resolvedAuction = true;

  }

  var Region = function(regionProps) {
    this.name = regionProps.name;
    this.presents = regionProps.presents || 0;
    this.traders = {}; // need player
    this.movedTraders = {};
    this.tradingPost = {}; // need player
    this.teaHouse = null;
  }

  if (!options) {
    options = {
      id: gameId,
      phase: 'prestart', // prestart, auction, bank, resolve, move, inspector, presents, conversion, finished
      playerIds: [], // this is always in the right turn order
      currentPlayerIndex: 0,
      history: [],
      round: 0,
      createTime: new Date().getTime(),
      lastUpdate: new Date().getTime(),
      players: {
        'red': new Player('red'),
        'yellow': new Player('yellow'),
        'purple': new Player('purple'),
        'blue': new Player('blue'),
        'green': new Player('green'),
      },

      auctions: {
        'bank': {},
        'trader': {},
        'horse': {},
        'building': {},
        'influence': {},
        'border': {},
      },

      board: {},

      bridges: {}
    };

    for (var i = 0; i < config.regions.length; i++) {
      options.board[config.regions[i].name] = new Region(config.regions[i]);
      options.board[config.regions[i].name].index = i;
    }
  }

  for (var i in options) {
    this[i] = options[i];
  }
};

// start asych methods

Game.find = function(gameId, callback) {
  db.get('game-' + gameId, function(err, gameProps) {
    if (err) {
      return callback(err);
    }

    if (!gameProps) {
      return callback('not found');
    }

    callback(null, new Game(gameProps.id, gameProps));
  });
}

Game.list = function(callback) {
  db.list('game-', function(err, games) {
    if (err || !games) {
      return callback(err);
    }

    games = games.sort(function(a, b) {
      if (a.lastUpdate > b.lastUpdate) {
        return -1;
      }  else {
        return 1;
      }
    });

    return callback(err, games);
  });
}

Game.create = function(user, color, callback) {
  console.log('creating game');
  if (config.validColors.indexOf(color) === -1) {
    return callback('invalid color');
  }

  db.get('gameNextId', function(err, gameNextId) {
    if (err) {
      return callback(err);
    }

    if (!gameNextId) {
      gameNextId = 1;
    } else {
      gameNextId++;
    }

    var randomStr = 'abcefhijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    var gameId = gameNextId + '-' + randomStr[Math.floor(randomStr.length*Math.random())] + randomStr[Math.floor(randomStr.length*Math.random())];

    db.set('gameNextId', gameNextId++);

    var game = new Game(gameId);

    game.save(function(err, game) {
      Game.find(gameId, callback)
    });

  });
  
};

Game.prototype.save = function(callback) {
  this.lastUpdate = new Date().getTime();
  db.set('game-' + this.id, this, function(err, game) {
    ws.gameAlert(game.id, 'updated');
    callback(err, game);
  });
};

Game.prototype.update = function(newGameState, callback) {
  this.lastUpdate = new Date().getTime();
  db.set('game-' + this.id, newGameState, function(err, game) {
    callback(err, game);
  });
};

// end asyc methods

Game.prototype.reset = function() {
  var newPlayers = [];
  // for (var i = 0; i < this.playerIds.length; i++) {
  //   var playerId = this.playerIds[i];
  //   newPlayers.push({
  //     id: playerId.id,
  //     name: playerId.name,
  //     color: playerId.color,
  //   });
  // }

  var game = new Game(this.id)
  //game.playerIds = newPlayers;

  return game;
};

Game.prototype.addPlayer = function(user, color) {
  console.log('adding player');
  if (this.phase !== 'prestart') {
    throw new Error('the game has already started');
  }

  // see if valid color
  if (!this.players[color]) {
    throw new Error('invalid color');
  }

  // see if color is taken
  // make sure player isn't already in game
  for (var i = 0; i < this.playerIds.length; i++) {
    if (this.playerIds[i].color === color) {
      throw new Error('this color is already taken');
    }

    if (this.playerIds[i].id == user.id) {
      return callback('you are already in the game');
    }
  }

  // yay we can add the player
  this.playerIds.push({
    id: user.id,
    name: user.email.split('@')[0],
    color: color,
  })

  this.players[color].id = user.id;

  this.addLog(user, 'joins the game');
};

Game.prototype.start = function(player) {
  if (this.phase !== 'prestart') {
    throw new Error('the game has already started');
  }

  // make sure player is in the game
  var found = false;
  for (var i = 0; i < this.playerIds.length; i++) {
    if (this.playerIds[i].id == player.id) {
      found = true;
    }
  }
  if (found == false) {
    throw new Error('you are not in this game');
  }

  var removeColors = {};

  for (var i in this.players) {
    removeColors[i] = true;
  }

  for (var i = 0; i < this.playerIds.length; i++) {
    delete removeColors[this.playerIds[i].color]
  }

  for (var i in removeColors) {
    delete this.players[i];
  }

  function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  shuffle(this.playerIds);

  var coins = [9, 9, 12, 12, 15];

  for (var i = 0; i < this.playerIds.length; i++) {
    this.players[this.playerIds[i].color].coins = coins[i];
  }

  this.addLog(player, 'game has started');

  this.startAuctionPhase();
}

// add helper functions
require('./helpers')(Game);

// phase transition
require('./phase')(Game);

// auction actions
require('./phase-auction')(Game);

// bank phase
require('./phase-bank')(Game);

// resolve phase
require('./phase-resolve')(Game);

// move phase
require('./phase-move')(Game);

// inspector phase
require('./phase-inspector')(Game);

// preset phase
require('./phase-present')(Game);

// income phase
require('./phase-income')(Game);

module.exports = Game;