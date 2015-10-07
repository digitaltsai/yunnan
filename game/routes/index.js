var Game = require('../model/Game');
var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  // this will just show the games and allow you to create new ones
  console.log(typeof req.user, req.user);
  res.render('game/index', {user: req.user});
});

router.get('/list', function(req, res, next) {
  console.log(req.user);
  Game.list(function(err, gameList) {
    res.status(200).json(gameList);
  })
});

router.post('/new', function(req, res, next) {
  console.log('game/new');
  Game.create(req.user, req.body.color, function(err, game) {
    if (err) {
      throw err;
    }

    game.addPlayer(req.user, req.body.color);
    game.save(function(err, game) {
      if (err) {
        throw err;
      }

      res.status(200).json(game);
    });

  })
});

router.param('gameId', function(req, res, next, gameId) {
  Game.find(gameId, function(err, game) {
    if (err) {
      next(new Error(err));
    } else if (game) {
      req.game = game;
      next();
    } else {
      res.status(404).send('failed to load game');
    }
  });
});

router.use('/:gameId', function(req, res, next) {
  var game = req.game;
  var userId = req.user.id;
  for (var i = 0; i < game.playerIds.length; i++) {
    if (game.playerIds[i].id == userId) {
      var color = game.playerIds[i].color;
      req.player = game.players[color];
      return next();
    }
  }
  req.oldState = JSON.stringify(game);

  req.player = null;
  next();
});

router.get('/:gameId', function(req, res, next) {
  var gameId = req.params.gameId;

  if (req.game.phase == 'prestart') {
    return res.render('game/prestart', {game: req.game, player: req.player});
  }

  res.render('game/game', {user: req.user, game: req.game, player: req.player});
});

router.get('/:gameId/info', function(req, res, next) {
  var gameId = req.params.gameId;
  res.json(req.game);
});

router.post('/:gameId/join', function(req, res, next) {
  var game = req.game;
  game.addPlayer(req.user, req.body.color);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    res.status(200).json(game);
  })
});

router.post('/:gameId/reset', function(req, res, next) {
  var game = req.game;
  game = game.reset();
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);  
  })
});

router.use('/:gameId', function(req, res, next) {
  if (!req.player) {
    return res.status(401).send('you are not in game');
  }
  next();
});

// everything below assumes you are a player

router.post('/:gameId/start', function(req, res, next) {
  var game = req.game;
  game.start(req.player);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/bid', function(req, res, next) {
  var game = req.game;
  game.bid(req.player, req.body.auctionItem, req.body.bidLevel, req.body.from);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/passAuction', function(req, res, next) {
  var game = req.game;
  game.passAuction(req.player);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/auctionPuer', function(req, res, next) {
  var game = req.game;
  game.auctionPuer(req.player, req.body.from);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/resolveAuction', function(req, res, next) {
  var game = req.game;
  game.resolveBuilding(req.player, req.body.buildingType)
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/move', function(req, res, next) {
  var game = req.game;
  game.move(req.player, req.body.origin, req.body.destination, req.body.kickColor);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/build', function(req, res, next) {
  var game = req.game;
  game.build(req.player, req.body.buildingType, req.body.origin, req.body.destination);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/endMove', function(req, res, next) {
  var game = req.game;
  game.endMove(req.player);
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.post('/:gameId/allocateIncome', function(req, res, next) {
  var game = req.game;
  game.allocateIncome(req.player, req.body.points)
  game.save(function(err, game) {
    if (err) {
      return res.status(400).send(err);
    }
    return res.status(200).json(game);
  });
});

router.use(function(err, req, res, next) {
  console.log(err.stack);
  if (err) {
    res.status(400).send(err.message);
  }
})

module.exports = router;