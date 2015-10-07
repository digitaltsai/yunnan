var config = require('../config');

module.exports = function(Game) {
  Game.prototype.startPresentPhase = function() {
    var self = this;
    for (var regionName in this.board) {
      var region = this.board[regionName];
      if (region.presents) {

        // create the queue of people to give presents to

        // get the highest influence
        var highestInfluences = [];
        for (var color in region.traders) {
          if (highestInfluences.indexOf(this.players[color].influence) === -1) {
            highestInfluences.push(this.players[color].influence);
          }
        }

        highestInfluences.sort().reverse();

        var traderCopy = JSON.parse(JSON.stringify(region.traders));

        // time to create the queue

        var influenceExists = function(influenceLevel, traderCopy) {
          for (var color in traderCopy) {
            if (traderCopy[color] && self.players[color].influence == influenceLevel) {
              return true;
            } 
          }
          return false;
        };

        var queue = [];
        for (var i = 0; i < highestInfluences.length; i++) {
          var counter = 0;
          while (influenceExists(highestInfluences[i], traderCopy)) {
            var playerIndex = counter % this.playerIds.length;
            var color = this.playerIds[playerIndex].color;
            if (traderCopy[color] && this.players[color].influence == highestInfluences[i]) {
              traderCopy[color]--;
              queue.push(color);
            }
            counter++;
          }
        }
        console.log(highestInfluences, queue, traderCopy);
        while (queue.length && region.presents > 0) {
          var color = queue.shift();
          region.presents--;
          this.players[color].presents++;
          this.addLog(this.players[color], "gets a present from " + region.name);
        }

      }
    }

    this.startIncomePhase();
  }
}