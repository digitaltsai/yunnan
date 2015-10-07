(function() {

  var config = {
    order: ['PU\'ER', 'YUNNAN', 'SICHUAN', 'QAMBDO', 'TIBET', 'QINGHAI'],
    
    sprite: {
      width: 9,
      height: 15
    },

    bridges: [
      {
        start: 'YUNNAN',
        end: 'TIBET'
      },
      {
        start: 'YUNNAN',
        end: 'QAMBDO'
      },
      {
        start: 'SICHUAN',
        end: 'QINGHAI'
      },
      {
        start: 'QAMBDO',
        end: 'QINGHAI'
      }
    ],

  // bridges: [{start: 'YUNNAN', end: 'QAMBDO'},
  //           {start: 'YUNNAN', end: 'TIBET'},
  //           {start: 'SICHUAN', end: 'QINGHAI'},
  //           {start: 'QUAMDO', end: 'QINGHAI'}],

    cities: {
      'PU\'ER': {
        x: 260,
        y: 420
      },
      'YUNNAN': {
        x: 500,
        y: 300,
        'bridges': {
          'QAMBDO': true,
          'TIBET': true
        }
      },
      
      'SICHUAN': {
        x: 600,
        y: 0,
        'bridges': {
          'QINGHAI': true
        }
      },
      
      'QAMBDO': {
        x: 350,
        y: 120,
        'bridges': {
          'QINGHAI': true
        }
      },

      'TIBET': {
        x: 0,
        y: 200
      },

      'QINGHAI': {
        x: 100,
        y: 0
      }
    },

    city: {
      width: 230,
      height: 170,
      coordinates: {
        'PU\'ER': {
          x: 260,
          y: 420
        },
        
        'YUNNAN': {
          x: 500,
          y: 300
        },
        
        'SICHUAN': {
          x: 600,
          y: 0
        },
        
        'QAMBDO': {
          x: 350,
          y: 120
        },

        'TIBET': {
          x: 0,
          y: 200
        },

        'QINGHAI': {
          x: 100,
          y: 0
        }
      }

    }

  };


  var GameMap = function(containerId, canvasId, game) {
    this.$container = $('#' + containerId);
    this.canvas = document.getElementById(canvasId);
    this.canvas.width = this.$container.width();
    this.canvas.height = this.$container.height();

    this.$cities = {};

    this.game = game;

    
  };

  GameMap.prototype.draw = function() {
    this.drawBase();
    this.drawGame();
  };

  GameMap.prototype.drawBase = function() {
    this.drawCities();
    this.drawMainRoads();
    this.drawBridges();
  };

  GameMap.prototype.drawCities = function() {
    var self = this;
    var counter = 0;
    var trading = 0;
    for (var i in config.city.coordinates) {
      (function(cityName) {
        var $city = $('<div class="mapCity"><p>' + cityName + '</p></div>')
        $city.css('width', config.city.width + 'px');
        $city.css('height', config.city.height + 'px');
        $city.css('left', config.city.coordinates[cityName].x + 'px');
        $city.css('top', config.city.coordinates[cityName].y + 'px');
        $city.data('cityName', cityName)
        self.$container.append($city);

        $city.append('<div class="mapIncomeInfo">' +
                      '<table><tr><td><img src="/images/person.png"> :</td><td>' + ((counter+1) * 3) + '</td></tr>' +
                      '<tr><td><img src="/images/tradingpost.png"> :</td><td>' + trading + '</table></div>')

        self.$cities[cityName] = $city;
      })(i);
      counter++;
      trading += counter;
    }
  };

  GameMap.prototype.drawBridges = function() {
    var self = this;
    for (var i = 0; i < config.bridges.length; i++) {
      var start = this.findCenter(config.bridges[i].start);
      var end = this.findCenter(config.bridges[i].end);
      $rectangle = createRect(start.x, start.y, end.x, end.y);
      $rectangle.data('start', config.bridges[i].start);
      $rectangle.data('end', config.bridges[i].end);
      $('#mapBridges').append($rectangle);
    }
  }

  function createRect(x1, y1, x2, y2) {
    var rect = $('<div class="mapBridge"></div>');
    
    var angleDeg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var length = Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    rect.css('width', length + 'px');
    rect.css('height', '10px');
    rect.css('left', Math.min(x1, x2));
    rect.css('top', Math.min(y1, y2) + (Math.floor(Math.abs(y2 - y1)/2) - 10));
    if (phase == 'auction') {
      rect.addClass('mapBridgeAuction');
    }
    
    rect.css('-webkit-transform', 'rotate(' + angleDeg + 'deg)')
    return rect;
  }


  GameMap.prototype.drawMainRoads = function() {
    for (var i = 0; i < config.order.length-1; i++) {
      this.drawRoad(config.order[i], config.order[i+1])
    }
  };

  GameMap.prototype.drawRoad = function(from, to) {
    var fromCenter = this.findCenter(from);
    var toCenter = this.findCenter(to);

    var ctx = this.canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(fromCenter.x, fromCenter.y);
    ctx.lineTo(toCenter.x, toCenter.y);
    ctx.stroke();
  };

  GameMap.prototype.drawColoredRoad = function(color, from, to) {
    // get offset
    var offset = this.game.playerIds.length;
    for (var i = 0; i < this.game.playerIds.length; i++, offset--) {
      if (this.game.playerIds.color == color) {
        break;
      }
    }

    if (offset <= 0) {
      offset--;
    }

    offset = offset * 10;

    var fromCenter = this.findCenter(from);
    var toCenter = this.findCenter(to);

    var ctx = this.canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(fromCenter.x+offset, fromCenter.y+offset);
    ctx.lineTo(toCenter.x+offset, toCenter.y+offset);
    ctx.stroke();
  }

  GameMap.prototype.findCenter = function(cityName) {
    var centerX = config.city.coordinates[cityName].x + ( config.city.width / 2 );
    var centerY = config.city.coordinates[cityName].y + ( config.city.height / 2 );
    
    return {
      x: centerX,
      y: centerY
    }
  };

  GameMap.prototype.drawGame = function() {
    // draw player sprites
    for (var cityName in this.game.board) {
      var offset = 20;
      for (var color in this.game.players) {
        if (this.drawPlayerUnitsInCity(color, cityName, offset)) {
          offset += 15;
        }
      }
    }



    // time to draw bridges that exist

    var factor = {};
    for (var color in this.game.bridges) {
      for (var start in this.game.bridges[color]) {
        for (var end in this.game.bridges[color][start]){
          if (!factor[start+end]) {
            factor[start+end] = 100
          }
          if (config.cities[start].bridges && config.cities[start].bridges[end]) {
              var fromCenter = this.findCenter(start);
              var toCenter = this.findCenter(end);
              var context = this.canvas.getContext('2d');

              context.beginPath();
              context.moveTo(fromCenter.x, fromCenter.y);
              context.bezierCurveTo(fromCenter.x, fromCenter.y-factor[start+end], toCenter.x, toCenter.y-factor[start+end], toCenter.x, toCenter.y);
              context.lineWidth = 2;

              // line color
              context.strokeStyle = color != 'yellow' ? color : '#ffee5b';

              context.stroke();
              factor[start+end] += 12;
          }
        }
      }
    }
  };

  GameMap.prototype.setText = function(text) {
    var $cancelButton = $('<button class="mapCancel">Cancel</button>');
    $cancelButton.click(function() {
      location.reload();
    });
    $('#mapInstructions').text(text).append($cancelButton);
  }

  GameMap.prototype.setConfirm = function(text, $button) {
    var $cancelButton = $('<button class="mapCancel">Cancel</button>');
    $cancelButton.click(function() {
      location.reload();
    });
    $button.addClass('mapConfirm');
    $('#mapInstructions').text(text).append($button).append($cancelButton);;
  }

  GameMap.prototype.drawPlayerUnitsInCity = function(color, cityName, offset) {
    $playerDiv = $('<div class="mapPlayer mapColor-' + color + '" data-src="' + color + '"></div>')
    $playerDiv.css('top', offset + 'px');

    var hasUnitHere = false;

    // is the horse here?
    if (this.game.players[color].horseLocation == config.order.indexOf(cityName)) {
      hasUnitHere = true;
      $playerDiv.append('<img class="spriteHorse mapSprite" src="/images/horse.png">');
    }

    // is the horse here?
    var traders = this.game.board[cityName].traders[color] || 0;
    var movedTraders = this.game.board[cityName].movedTraders[color] || 0;

    if (this.game.board[cityName].teaHouse == color) {
      hasUnitHere = true;
      $playerDiv.append('<img class="spriteTeaHouse mapSprite" src="/images/teahouse.png">');
    }

    if (this.game.board[cityName].tradingPost[color]) {
      hasUnitHere = true;
      for (var i = 0; i < this.game.board[cityName].tradingPost[color]; i++) {
        $playerDiv.append('<img class="spriteTradingPost mapSprite" src="/images/tradingpost.png">');
      }
    }

    if (traders) {
      hasUnitHere = true;
      for (var i = 0; i < traders; i++) {
        $playerDiv.append('<img class="spriteTrader mapSprite" src="/images/person.png">');
      }
    }

    if (movedTraders) {
      hasUnitHere = true;
      for (var i = 0; i < movedTraders; i++) {
        $playerDiv.append('<img class="spriteMovedTrader mapSprite" src="/images/person.png">');
      }
    }

    if (hasUnitHere) {
      this.$cities[cityName].append($playerDiv);
    }

    return hasUnitHere;
  };

  window.GameMap = GameMap;

})()