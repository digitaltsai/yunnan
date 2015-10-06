var config = require('../config');

module.exports = function(Game) {

  Game.prototype.startAuctionPhase = function() {
    if (this.phase !== 'prestart' && this.phase !== 'income') {
      throw new Error('not the right time');
    }

    if (this.phase === 'income') {
      this.addLog('reversed player order');
      this.playerIds.reverse();
    }

    // move the people from puer to the free trading
    for (var color in this.players) {
      var peopleInPuer = this.board[config.regions[0].name].traders[color] || 0;
      this.board[config.regions[0].name].traders[color] = 0;
      this.players[color].freeTraders = peopleInPuer + this.players[color].freeTraders;
      this.players[color].passAuction = false;
    }

    // reset the auction board

    for (var i in this.auctions) {
      if (i === 'bank') {
        this.auctions[i] = {'high': null, 'low': null};
      } else {
        this.auctions[i] = {'5': null, '7': null, '9': null, '12': null, '15': null};
      }
    }

    this.phase = 'auction';
    this.round++;

    this.currentPlayerIndex = 0;

    this.addLog('auction phase started');
  }

  Game.prototype.bid = function(player, auctionItem, bidLevel, from) {
    // check that it's in the right phase
    if (this.phase !== 'auction') {
      throw new Error('this action is only available in auction phase');
    }

    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    // make sure this is an auction item
    if (typeof this.auctions[auctionItem] === 'undefined') {
      throw new Error('this is not a valid auction type');
    }

    if (player.freeTraders == 0 && this.getTravelingTraders(player.color).count == 0) {
      throw new Error('no traders available. how did you get a turn?')
    }

    if (from && !this.isValidLocation(from)) {
      throw new Error('invalid location');
    }

    if (!from && player.freeTraders == 0) {
      throw new Error('you have no free traders available. must take from traveling')
    }

    if (from == config.regions[0].name) {
      throw new Error('cannot move from ' + config.regions[0].name)
    }

    if (from && !this.board[from]['traders'][player.color]) {
      throw new Error('no traders available in this region')
    }

    var item = this.auctions[auctionItem];

    // make sure its a valid bid
    if (typeof item[bidLevel] == 'undefined') {
      throw new Error('not a valid bid level');
    }

    // make sure you don't have any bids on there
    for (var i in item) {
      if (item[i] == player.color) {
        throw new Error('you have already bidded on this item');  
      }
    }

    if (player.passAuction == true) {
      throw new Error('you have already ended your auction turn')
    }

    // make sure isn't taken yet
    if (item[bidLevel]) {
      throw new Error('this bidLevel is already bidded on');
    }

    // if its a trader, make sure
    if (auctionItem === 'trader' && player.totalTraders == 7) {
      throw new Error('you cannot have more than 7 traders')
    }

    if (auctionItem === 'horse' && player.horseLocation == config.regions.length) {
      throw new Error('you have explores all the lands already')
    }

    if (auctionItem === 'influence' && player.influence == 4) {
      throw new Error('you cannot have more than 4 influence');
    }

    if (auctionItem === 'border' && player.border == 6) {
      throw new Error('you cannot have more than 6 border crossings');
    }

    if (auctionItem === 'building' && (this.countBuildings(player, 'bridge') + this.countBuildings(player, 'tradingPost') + this.countBuildings(player, 'teaHouse')) == 6) {
      throw new Error('you cannot build anymore buildings');
    }

    if (auctionItem === 'bank') {
      // have to move all other people to puer
      // ends auction for player
      // TODO: should do this in the nextPlayer function for auctions
      for (var i in this.auctions) {
        if (i !== 'bank') {
          for (var j in this.auctions[i]) {
            if (this.auctions[i][j] == player.color) {
              this.auctions[i][j] = null; // this removes the trader from the auction house
              this.addTrader(player, config.regions[0].name);
              this.addLog(player, 'removing ' + i + ' - ' + j + ' coins');
            }
          }
        }
      }

      player.passAuction = true;

      item[bidLevel] = player.color;

      this.addLog(player, 'bidding on ' + auctionItem + ' (' + bidLevel + ')');
    } else {
      var highestBid = 0;
      for (var i in auctionItem) {
        if (auctionItem[i] && i > highestBid) {
          highestBid = i;
        }
      }

      if (bidLevel < 9 && highestBid >= 9) {
        throw new Error('cannot bid on 5 or 7 when there is 9 or more');
      }

      // everything is ok now
      item[bidLevel] = player.color;

      this.addLog(player, 'bidding on ' + auctionItem + ' for ' + bidLevel + ' coins' + (from ? ' from ' + from : ''));

      // make sure nothing is on 5 or 7
      if (bidLevel > 5) {
        if (item[5]) {
          this.players[item[5]].freeTraders++;
          this.players[item[5]].passAuction = false;
          this.addLog(this.players[item[5]], 'got kicked out of ' + auctionItem + ' - 5 coins');
          item[5] = null;
        }
      }

      if (bidLevel > 7) {
        if (item[7]) {
          this.players[item[7]].freeTraders++;
          this.players[item[7]].passAuction = false;
          this.addLog(this.players[item[7]], 'got kicked out of ' + auctionItem + ' - 7 coins');
          item[7] = null;
        }
      }
    }

    if (from) {
      this.board[from]['traders'][player.color]--;
    } else {
      player.freeTraders--;
    }

    this.nextPlayer();
  }

  Game.prototype.auctionPuer = function(player, from) {
    if (this.phase !== 'auction') {
      throw new Error('this action is only available in auction phase');
    }

    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    if (player.passAuction == true) {
      throw new Error('you have already ended your auction turn');
    }

    if (from && !this.isValidLocation(from)) {
      throw new Error('invalid location');
    }

    if (!from && player.freeTraders == 0) {
      throw new Error('you have no free traders available. must take from traveling')
    }

    if (from == config.regions[0].name) {
      throw new Error('cannot move from ' + config.regions[0].name)
    }

    if (from && !this.board[from].traders[player.color]) {
      throw new Error('no traders available in this region')
    }

    if (from) {
      this.addLog(player, 'Placed trader from ' + from + ' into Pu\'er');
      this.board[from].traders[player.color]--;
    } else {
      this.addLog(player, 'Placed trader from supply into Pu\'er');
      player.freeTraders--;
    }

    this.board[config.regions[0].name].traders[player.color]++;

    this.nextPlayer();
  };

  Game.prototype.passAuction = function(player) {
    if (this.phase !== 'auction') {
      throw new Error('this action is only available in auction phase');
    }

    // check that it's the current player's turn
    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    if (player.passAuction == true) {
      throw new Error('you have already ended your auction turn');
    }

    player.passAuction = true;

    this.nextPlayer();
  };
}