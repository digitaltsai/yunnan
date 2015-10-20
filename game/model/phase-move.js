var config = require('../config');

module.exports = function(Game) {

  Game.prototype.startMovePhase = function() {
    if (this.phase !== 'resolve') {
      throw new Error('can only transition to move from resolve');
    }

    this.playerIds.reverse();

    // move the people from puer to the free trading
    for (var color in this.players) {
      this.players[color].freeMoves = this.players[color].border;
      this.players[color].passMove = false;
    }

    // reset the moved traders
    for (var i in this.board) {
      this.board[i].movedTraders = {};
    }

    this.phase = 'move';

    this.currentPlayerIndex = 0;

    this.addLog('move phase started, reversed player order');

    this.moveContinue();
  }

  Game.prototype.moveContinue = function() {
    var player = this.players[this.playerIds[this.currentPlayerIndex].color];
    if (this.getBuildableCount(player) == 0) {
      if (player.freeMoves == 0 || !this.moveableTradersCount(player)) {
        this.endMove(player);
      }
    }
  };

  Game.prototype.move = function(player, from, to, kickColor) {

    // check that it's in the right phase
    if (this.phase !== 'move') {
      throw new Error('this action is only available in move phase');
    }

    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    // make sure this is an auction item
    if (!this.isValidLocation(from)) {
      throw new Error('this is not a valid starting location');
    }

    if (!this.isValidLocation(to)) {
      throw new Error('this is not a valid destination');
    }

    if (kickColor && !this.players[kickColor]) {
      throw new Error('this color does not exist');
    }

    if (kickColor && to == config.regions[0].name) {
      throw new Error('you cannot kick anyone from ' + config.regions[0].name)
    }

    if (kickColor && !this.board[to].traders[kickColor]) {
      throw new Error('this player has no people to kick at the destination');
    }

    if (kickColor && this.players[kickColor].influence >= player.influence) {
      throw new Error('you can only kick people who have less influence than you');
    }

    if (!this.board[from].traders[player.color]) {
      throw new Error('you do not have any moveable traders at the origin');
    }

    if (player.freeMoves == 0) {
      throw new Error('you have no more free moves');
    }

    if (player.horseLocation < this.getLocationIndex(to)) {
      throw new Error('you have not explored this far yet');
    }

    if (from == to) {
      throw new Error('you need to move');
    }

    // calculate shortest route from src/dest
    var moves = this.getShortestRoute(player, from, to);

    if (moves > player.freeMoves) {
      throw new Error('you do not have enough free moves');
    }

    // remove one from source
    this.board[from].traders[player.color]--;

    // add one to destination
    if (!this.board[to].movedTraders[player.color]) {
      this.board[to].movedTraders[player.color] = 1;
    } else {
      this.board[to].movedTraders[player.color]++;
    }

    this.addLog(player, 'moved trader from ' + from + ' to ' + to);

    // time to kick the player
    if (kickColor) {
      this.addLog(player, 'kicked ' + kickColor);
      this.board[to].traders[kickColor]--;
      this.addTrader(this.getPlayer(kickColor), config.regions[this.getLocationIndex(to)-1].name);
    }

    // minus those moves from freeMoves
    player.freeMoves = player.freeMoves - moves;

    this.moveContinue();
  }

  Game.prototype.build = function(player, buildingType, location, endLocation) {
    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    if (this.phase !== 'move') {
      throw new Error('it is not move phase');
    }

    if (typeof player.buildings[buildingType] == 'undefined') {
      throw new Error('invalid building choice');
    }

    if (player.horseLocation < this.getLocationIndex(location)) {
      throw new Error('you have not explored this far yet');
    }

    if (endLocation && player.horseLocation < this.getLocationIndex(endLocation)) {
      throw new Error('you have not explored this far yet');
    }

    var buildableCount = 0;
    for (var i in player.buildings) {
      buildableCount += player.buildings[i];
    }

    if (buildableCount == 0) {
      throw new Error('you have no more buildings to build');
    }

    if (typeof player.buildings[buildingType] == 0) {
      throw new Error('you have no more of these buildings');
    }

    if (!this.isValidLocation(location)) {
      throw new Error('this location does not exist');
    }

    if (config.regions[0].name == location) {
      throw new Error('you cannot build in ' . config.regions[0].name);
    }

    // if its a trading post...
    switch (buildingType) {
      case 'tradingPost':
        // make sure there isn't already one there
        if (this.board[location].tradingPost[player.color]) {
          this.board[location].tradingPost[player.color]++;
        } else {
          this.board[location].tradingPost[player.color] = 1;
        }
        this.addLog(player, 'build trading post at ' + location);
        break;
      case 'teaHouse':
        if (this.board[location].teaHouse) {
          throw new Error('there is already a teahouse at this location')
        }
        this.board[location].teaHouse = player.color;
        this.addLog(player, 'build tea house at ' + location);
        break;
      case 'bridge':
        // check if its a valid bridge
        if (!this.isValidLocation(endLocation)) {
          throw new Error('the end location does not exist');
        }

        // check if theres place to build a bridge here
        var valid = false;
        for (var i = 0; i < config.bridges.length; i++) {
          if (config.bridges[i].start == location && config.bridges[i].end == endLocation) {
            valid = true;
          }
        }

        if (!valid) {
          throw new Error('there is no bridge from ' + location + ' to ' + endLocation)
        }

        // check if it already exists
        if (this.bridges[player.color]) {
          if (this.bridges[player.color][location] && this.bridges[player.color][location][endLocation]) {
            throw new Error('this bridge already exists')
          }
        } else {
          this.bridges[player.color] = {};
        }

        // we create two way bridges here
        if (!this.bridges[player.color][location]) {
          this.bridges[player.color][location] = {};
        }

        this.bridges[player.color][location][endLocation] = true;

        if (!this.bridges[player.color][endLocation]) {
          this.bridges[player.color][endLocation] = {};
        }

        this.bridges[player.color][endLocation][location] = true;
        this.addLog(player, 'build bridge from ' + location + ' to ' + endLocation);
        break;
    }
    player.buildings[buildingType]--;
    buildableCount--;
    
    // if there are no more buildings, we can end the player's turn for him
    this.moveContinue();
  }

  Game.prototype.endMove = function(player) {
    // have to move all movedTraders into 
    for (var i in this.board) {
      if (this.board[i].movedTraders[player.color]) {
        var moving = this.board[i].movedTraders[player.color];
        if (this.board[i].traders[player.color]) {
          this.board[i].traders[player.color] += moving;
        } else {
          this.board[i].traders[player.color] = moving;
        }
        delete this.board[i].movedTraders[player.color];
      }
    }

    // if there isnt a connected route, then we will have to kick them all back to puer
    for (var regionName in this.board) {
      if (this.board[regionName].traders[player.color] && regionName != config.regions[0].name) {
        var cost = this.getCheapestRoute(player, config.regions[0].name, regionName);
        console.log('calculating cost for ' + regionName + ':' + cost);
        if (cost) {
          this.addTrader(player, config.regions[0].name, this.board[regionName].traders[player.color]);
          this.addLog(player, 'sending ' + this.board[regionName].traders[player.color] + ' traders from ' + regionName + 'back to ' + config.regions[0].name)
          this.board[regionName].traders[player.color]--;
        }
      }
    }

    player.passMove = true;

    this.nextPlayer();
  };
}