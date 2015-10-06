var config = require('../config');

// the only reason we need this is to resolve buildings
module.exports = function(Game) {

  Game.prototype.startResolvePhase = function() {
    if (this.phase !== 'bank') {
      throw new Error('can only transition to resolve phase from the bank phase');
    }

    this.phase = 'resolve';

    this.addLog('resolve phase started');

    // move the people from puer to the free trading
    for (var color in this.players) {
      this.players[color].resolvedAuction = false;
    }

    this.currentPlayerIndex = 0;

    this.resolveContinue();
  }

  Game.prototype.resolveContinue = function() {
    var player = this.players[this.playerIds[this.currentPlayerIndex].color];

    // we resolve everything except for buildings
    var hasBuilding = false;;
    for (var auctionItem in this.auctions) {
      if (auctionItem !== 'bank') {
        for (var coinCost in this.auctions[auctionItem]) {
          if (this.auctions[auctionItem][coinCost] == player.color) {
            // this person has bidded on this item
            switch(auctionItem) {
              case 'trader':
                player.totalTraders++;
                this.addTrader(player, config.regions[0].name);
                this.addLog(player, 'created new trader to ' + config.regions[0].name + ' for ' + coinCost + ' coins');
                break;
              case 'horse':
                player.horseLocation++;
                this.addLog(player, 'horse moved to ' + config.regions[player.horseLocation].name + ' for ' + coinCost + ' coins');
                break;
              case 'building':
                hasBuilding = true;
                player.freeBuildings++;
                this.addLog(player, 'has a free building' + ' for ' + coinCost + ' coins');
                break;
              case 'influence':
                player.influence++;
                this.addLog(player, 'influence increased to ' + player.influence + ' for ' + coinCost + ' coins');
                break;
              case 'border':
                player.border++;
                this.addLog(player, 'border crossings increased to ' + player.border + ' for ' + coinCost + ' coins');
                break;
              default:
                throw new Error('unknown auction item');
            }
            this.auctions[auctionItem][coinCost] = null;
            player.coins = player.coins - coinCost;
            if (player.coins < 0) {
              var multiplier = (9 - this.round);
              if (multiplier < 2) {
                multiplier = 2;
              }

              this.addLog(player, 'going into negative points, missing ' + Math.abs(player.coins) + ' coins, losing ' + (player.coins * multiplier) + ' points');

              player.points = player.points + (player.coins * multiplier);
              player.coins = 0;
            }
            player.freeTraders++;
          }
        }
      }
    }

    if (!hasBuilding) {
      player.resolvedAuction = true;
      this.nextPlayer();
    } else {
      this.addLog(player, 'needs to choose building');
      player.resolvedAuction = false;
    }
  }

  Game.prototype.resolveBuilding = function(player, buildingType) {
    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    if (this.phase !== 'resolve') {
      throw new Error('it is not auction resolve time');
    }

    if (player.resolvedAuction === true) {
      throw new Error('you have already resolved your auctions');
    }

    if (player.freeBuildings == 0) {
      throw new Error('you have no free buildings to resolve');
    }

    if (typeof player.buildings[buildingType] == 'undefined') {
      throw new Error('invalid building choice');
    }

    if (this.countBuildings(player, buildingType) == 2) {
      throw new Error('you can only have 2 of these buildings');
    }

    this.addLog(player, 'received a new ' + buildingType);

    player.buildings[buildingType]++;
    player.freeBuildings--;

    if (player.freeBuildings == 0) {
      this.endResolve(player);
    }
  }

  Game.prototype.endResolve = function(player) {
    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    if (this.phase !== 'resolve') {
      throw new Error('it is not auction resolve time');
    }

    if (player.resolvedAuction === true) {
      throw new Error('you have already resolved your auctions');
    }

    player.resolvedAuction = true;

    this.nextPlayer();
  }

}