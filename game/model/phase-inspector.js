var config = require('../config');

module.exports = function(Game) {
  Game.prototype.startInspectorPhase = function() {

    var richestRegion = config.regions[0].name;
    var richestIncome = 0;
    for (var i = 0; i < config.regions.length; i++) {
      var income = this.calculateRegionIncome(config.regions[i].name);
      if (income >= richestIncome) {
        richestIncome = income;
        richestRegion = config.regions[i].name;
      }

    }
    
    this.addLog('Inspector going to ' + richestRegion + ' for ' + richestIncome + ' income.');
    // now that we have the richest region, lets see who we want to kick

    var immuneColor = this.board[richestRegion].teaHouse;
    
    var highestPlayer = null;

    for (var i = 0; i < this.playerIds.length; i++) {
      var color = this.playerIds[i].color;

      if (color != immuneColor
          && this.players[color].influence < 4
          && this.board[richestRegion].traders[color]
          && (highestPlayer == null || this.players[color].influence > highestPlayer.influence)) {
        highestPlayer = this.players[color];
      }
    }

    if (highestPlayer) {
      // move one trader back to puer
      this.board[richestRegion].traders[highestPlayer.color]--;
      this.addTrader(highestPlayer, config.regions[0].name);
      this.addLog('Inspector kicked out a trader for ' + highestPlayer.color + ' back to ' + config.regions[0].name);
    }

    this.startPresentPhase();
  };

  Game.prototype.calculateRegionIncome = function(regionName) {

    var traderMultiplier = config.regions[this.board[regionName].index].income.trader;
    var postMultiplier = config.regions[this.board[regionName].index].income.tradingPost;

    var traders = 0;
    for (var color in this.board[regionName].traders) {
      traders += this.board[regionName].traders[color];
    }

    var posts = 0;
    for (var color in this.board[regionName].tradingPost) {
      if (this.findCheapestRoute(this.players[color], config.regions[0].name, regionName) == 0) {
        posts += this.board[regionName].tradingPost[color];  
      }
    }
    var regionIncome = (traders * traderMultiplier) + (posts * postMultiplier);
    this.addLog(regionName + ' has ' + traders + ' traders and ' + posts + ' trading posts: ' + regionIncome + ' total income')
    return regionIncome;
  }
}