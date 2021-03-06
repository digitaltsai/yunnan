var config = require('../config');
var Graph = require('node-dijkstra')

module.exports = function(Game) {

  Game.prototype.getPlayer = function(color) {
    for (var i = 0; i < this.playerIds.length; i++) {
      if (this.playerIds[i].color == color) {
        return this.playerIds[i];
      }
    }

    return null;
  }


  Game.prototype.addTrader = function(player, regionName, number) {
    if (!this.board[regionName]) {
      throw new Error('no region by this name');
    }

    if (!number) {
      number = 1;
    }

    var region = this.board[regionName];
    if (region.name == regionName) {
      if (region.traders[player.color]) {
        region.traders[player.color] += number;
      } else {
        region.traders[player.color] = number;
      }
      return;
    }
    // should never reach here
    throw new Error('region not found')
  };

  Game.prototype.getTravelingTraders = function(player) {
    var count = 0;
    for (var i in this.board) {
      if (i != config.regions[0].name) {
        if (this.board[i].traders[player.color]) {
          count += this.board[i].traders[player.color];
        }
      }
    }
    return count;
  };

  Game.prototype.getBuildableCount = function(player) {
    var count = 0;
    for (var i in player.buildings) {
      count += player.buildings[i];
    }
    return count;
  }

  Game.prototype.countBuildings = function(player, buildingName) {
    var count = 0;
    count += player.buildings[buildingName];
    if (buildingName == 'bridge') {
      if (this.bridges && this.bridges[player.color]) {
        count += Object.keys(this.bridges[player.color]).length / 2;
      }
    } else if (buildingName == 'teaHouse') {
      for (var i in this.board) {
        if (this.board[i].teaHouse == player.color) {
          count++;
        }
      }
    } else {
      for (var i in this.board) {
        if (this.board[i][buildingName] && this.board[i][buildingName][player.color]) {
          count +=this.board[i][buildingName][player.color];
        }
      }
    }
    return count;
  }

  Game.prototype.moveableTradersCount = function(player) {
    var count = 0;
    for (var i in this.board) {
      if (this.board[i].traders[player.color]) {
        count += this.board[i].traders[player.color];
      }
    }
    return count;
  }

  Game.prototype.getLocationIndex = function(locationName) {
    for (var i = 0; i < config.regions.length; i++) {
      if (config.regions[i].name == locationName) {
        return i;
      }
    }

    throw new Error('invalid location name');
  }

  Game.prototype.isValidLocation = function(locationName) {
    if (this.board[locationName] && locationName != 'bridge') {
      return true;
    }
    return false;
  };

  Game.prototype.getShortestRoute = function(player, from, to) {
    // time to create a tree map
    var routes = {
      // from: to
    };

    for (var i = 0; i < config.regions.length; i++) {
      routes[config.regions[i].name] = {};
    }

    for (var i = 0; i < config.regions.length-1; i++) {
      var origin = config.regions[i].name;
      var destination = config.regions[i+1].name;
      routes[origin][destination] = 1;
      routes[destination][origin] = 1;
    }

    // now see if there are bridges that can add to routes
    if (this.bridges[player.color]) {
      for (var origin in this.bridges[player.color]) {
        for (var destination in this.bridges[player.color][origin]) {
          routes[origin][destination] = 1;
        }
      }
    }

    var graph = new Graph(routes);

    var cheapestRoute = graph.shortestPath(from, to);
    console.log(cheapestRoute);
    var cost = 0;
    for (var i = 0; i < cheapestRoute.length-1; i++) {
      cost = cost + routes[cheapestRoute[i]][cheapestRoute[i+1]];
    }
    return cost;
  };

  // Game.prototype.test = function() {
  //   return this.calculatePlayerIncome(this.getPlayer('blue'));
  // };

  // returns the cost of the route
  Game.prototype.getCheapestRoute = function(player, from, to) {
    // time to create a tree map
    var routes = {
      // from: to
    };

    for (var i = 0; i < config.regions.length; i++) {
      routes[config.regions[i].name] = {};
    }

    for (var i = 0; i < config.regions.length-1; i++) {
      var origin = config.regions[i].name;
      var destination = config.regions[i+1].name;

      if (this.board[destination].traders[player.color] || this.board[destination].tradingPost[player.color]) {
        routes[origin][destination] = 0;
      } else {
        routes[origin][destination] = 3;
      }
      
      if (this.board[origin].traders[player.color] || this.board[origin].tradingPost[player.color]) {
        routes[destination][origin] = 0;
      } else {
        routes[destination][origin] = 3;
      }
    }

    // now see if there are bridges that can add to routes
    if (this.bridges[player.color]) {
      for (var origin in this.bridges[player.color]) {
        for (var destination in this.bridges[player.color][origin]) {
          if (this.board[destination].traders[player.color] || this.board[destination].tradingPost[player.color]) {
            routes[origin][destination] = 0;
          } else {
            routes[origin][destination] = 3;
          }
        }
      }
    }
    console.log(from, to)
    console.log(routes);
    

    var graph = new Graph(routes);

    var cheapestRoute = graph.shortestPath(from, to);
    console.log(cheapestRoute);
    var cost = 0;
    for (var i = 0; i < cheapestRoute.length-1; i++) {
      cost = cost + routes[cheapestRoute[i]][cheapestRoute[i+1]];
    }
    return cost;

  }

  Game.prototype.addLog = function(player, str) {
    var color = '';
    if (str) {
      for (var i = 0; i < this.playerIds.length; i++) {
        if (this.playerIds[i].id == player.id) {
          color = this.playerIds[i].color;
          break;
        }
      }
      this.history.push(color + ' : ' + str);
    } else {
      this.history.push(player);
    }
    console.log(this.history[this.history.length-1]);
  }

}