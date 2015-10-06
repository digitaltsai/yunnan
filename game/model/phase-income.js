var config = require('../config');

module.exports = function(Game) {
  Game.prototype.startIncomePhase = function() {
    var self = this;
    for (var i in this.players) {
      this.players[i].income = this.calculatePlayerIncome(this.players[i]);
      this.addLog(this.players[i], 'has ' + this.players[i].income + ' income');
    }

    var oldOrder = this.playerIds.map(function(player) {return player.color});

    // rearrange turn order from highest to lowest points
    var order = [];
    for (var i = 0; i < this.playerIds.length; i++) {
      var color = this.playerIds[i].color;

      this.playerIds[i].value = this.players[color].income
      
      order.push(this.playerIds[i]);
    }
    
    order = order.sort(function(a, b) {
      if (a.value < b.value) {
        return -1;
      } else if (a.value > b.value) {
        return 1;
      }
      return 1;
    });

    for (var i = 0; i < this.playerIds.length; i++) {
      delete this.playerIds[i].value;
    }

    this.playerIds = order;

    this.playerIds.reverse();

    var newOrder = this.playerIds.map(function(player) {return player.color + '(' + self.players[player.color].income + ')'});

    this.addLog('starting income phase: switching from ' + oldOrder.join(',') + ' to ' + newOrder.join(','));

    this.currentPlayerIndex = 0;

    this.phase = 'income';

    this.incomeContinue();
  }

  Game.prototype.incomeContinue = function() {
    var player = this.players[this.playerIds[this.currentPlayerIndex].color];
    if (player.income == 0) {
      this.nextPlayer();
    }
  };

  Game.prototype.allocateIncome = function(player, points) {
    if (points != parseInt(points)) {
      throw new Error('must give a valid number')
    }

    points = parseInt(points);
    var coins = player.income - points;

    if (this.playerIds[this.currentPlayerIndex].id != player.id) {
      throw new Error('it is not your turn');
    }

    if (this.phase !== 'income') {
      throw new Error('it is not income time');
    }

    if (coins < 0 || points < 0) {
      throw new Error('you cannot give negative coins or points');
    }

    player.coins += coins;
    player.points += points;

    this.addLog(player, 'allocated ' + points + ' as points and ' + coins + ' as coins');

    this.nextPlayer();
  }

  Game.prototype.calculatePlayerIncome = function(player) {
    var playerIncome = 0;
    for (var regionName in this.board) {
      var region = this.board[regionName];

      var tax = 0;
      if (regionName != config.regions[0].name) {
        this.getCheapestRoute(player, config.regions[0].name, regionName);
      }

      var traderMultiplier = config.regions[this.board[regionName].index].income.trader - tax;
      var postMultiplier = (tax == 0 ? config.regions[this.board[regionName].index].income.tradingPost : 0);
      
      var traders = region.traders[player.color] || 0;
      var posts = region.tradingPost[player.color] || 0;
      
      var regionIncome = (traders * traderMultiplier) + (posts * postMultiplier);
      playerIncome += regionIncome;
      //this.addLog('individual ' + regionName + ' has ' + traders + ' traders and ' + posts + ' trading posts: ' + regionIncome + ' total income')
    }
    return playerIncome;
  }
}