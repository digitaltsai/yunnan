var config = require('../config');

module.exports = function(Game) {
  Game.prototype.startPresentPhase = function() {
    for (var regionName in this.board) {
      var region = this.board[regionName];
      if (region.presents) {

        // create the queue of people to give presents to

        // get the highest influence
        var highestInfluence = 0;
        for (var color in region.traders) {
          if (this.players[color].influence > highestInfluence) {
            highestInfluence = this.players[color].influence
          }
        }

        var traderCopy = JSON.parse(JSON.stringify(region.traders));
        for (var color in traderCopy) {
          if (highestInfluence != this.players[color].influence) {
            traderCopy[color] = 0;
          }
        }

        var tradersLeft = function(traderCopy) {
          var total = 0;
          for (var i in traderCopy) {
            total += traderCopy[i];
          }
          return total;
        }

        var playerIndex = 0;
        while (tradersLeft(traderCopy) > 0 && region.presents > 0) {
          if (traderCopy[this.playerIds[playerIndex].color]) {
            traderCopy[this.playerIds[playerIndex].color]--;
            this.players[this.playerIds[playerIndex].color].presents++;
            region.presents--;
          }

          playerIndex++;
          if (playerIndex == this.playerIds.length) {
            playerIndex = 0;
          }
        }
      }
    }

    this.startIncomePhase();
  }
}