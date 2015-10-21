(function() {

  var state = 'waiting';

  var Game = function(gameData, map){
    this.data = gameData;
    this.map = map;
    this.state = 'waiting';
    this.init();
  }

  Util.inherits(Game, EventEmitter);

  Game.prototype.setState = function(str) {
    console.log('setting game state from ' + state + ' to ' + str);
    this.state = str;
  };

  Game.prototype.getState = function() {
    return this.state;
  };

  Game.prototype.enterBuildSequence = function(buildingType) {
    var self = this;
    
    var postData = {
      buildingType: buildingType
    };
    
    $('.phaseMove').hide();

    switch (buildingType) {
      case 'bridge':
        $('#mapBridges').find('.mapBridge').each(function() {
          var start = $(this).data('start');
          var end = $(this).data('end');

          // see if player has bridge already
          if (!(self.data.bridges[player.color] && self.data.bridges[player.color][start] && self.data.bridges[player.color][start][end])) {
            $(this).addClass('mapHoverable');
            $(this).show();
          }
        });

        $('.mapBridge').bind('click.origin', function() {
          var start = $(this).data('start');
          var end = $(this).data('end');
          postData.origin = start;
          postData.destination = end;

          $.post(gameUrl + '/build', postData, function(result) {
            console.log(result);
          }).fail(function(response) {
            alert(response.responseText);
          });
        });
        break;
      case 'teaHouse':
        for (var cityName in self.data.board) {
          if (!self.data.board[cityName].teaHouse) {
            self.map.$cities[cityName].addClass('mapHoverable');
            self.map.$cities[cityName].bind('click.origin', function() {
              var location = $(this).data('cityName');
              postData.origin = location;
              $.post(gameUrl + '/build', postData, function(result) {
                console.log(result);
              }).fail(function(response) {
                alert(response.responseText);
              });
            });
          }
        }

        break;
      case 'tradingPost':
        for (var cityName in self.data.board) {
          if (self.data.board[cityName].index <= player.horseLocation) {
            self.map.$cities[cityName].addClass('mapHoverable');
            self.map.$cities[cityName].bind('click.origin', function() {
              var location = $(this).data('cityName');
              postData.origin = location;
              $.post(gameUrl + '/build', postData, function(result) {
                console.log(result);
              }).fail(function(response) {
                alert(response.responseText);
              });
            });
          }
        }

        break;
    }

  };

  Game.prototype.enterMoveSequence = function() {
    if (this.getState() !== 'waiting') {
      return;
    }
    $('.phaseMove').hide();
    this.setState('moving');

    var self = this;
    this.disableEnterButtons();

    this.map.setText('Moving - select origin city')

    var origin = null;
    var destination = null;
    var kickColor = null;

    var chooseOrigin = function() {
      $('.mapCity').unbind('click.origin')
      $('.mapCity').removeClass('mapHoverable');
      $(this).addClass('mapSelected');
      self.map.setText('Moving - select destination city')
      origin = $(this).data('cityName');

      // find all the cities that this player has people in
      for (var cityName in self.data.board) {
        if (origin != cityName && self.data.board[cityName].index <= player.horseLocation && cityName != origin) {
          self.map.$cities[cityName].addClass('mapHoverable');
          self.map.$cities[cityName].bind('click.destination', chooseDestination);
        }
      }
    }

    var chooseDestination = function() {
      $('.mapCity').unbind('click.destination')
      $('.mapCity').removeClass('mapHoverable');
      $(this).addClass('mapSelected');
      destination = $(this).data('cityName');

      self.map.setText('Moving - ' + origin + ' => ' + destination + ', select people to kick');

      // check if they can kick anyone in here with lower influence
      var hasPeople = false;

      var traders = self.data.board[destination].traders;
      for (var i in traders) {
        if (i != player.color && self.data.board[destination].traders[i] && self.data.players[i].influence < player.influence) {
          hasPeople = true;
          $(this).find('.mapColor-' + i).find('.spriteTrader').first().addClass('spriteHoverable')
          $(this).find('.mapColor-' + i).find('.spriteTrader').first().bind('click.trader', chooseKick)
        }
      }

      if (hasPeople) {
        self.map.setText('Moving - select color to kick')  
      } else {
        showConfirm();
      }
    }

    var chooseKick = function() {
      $('.spriteTrader').unbind('click.trader');
      $('.spriteTrader').removeClass('spriteHoverable');
      $(this).addClass('spriteSelected');
      kickColor = $(this).parent().attr('data-src');

      showConfirm();
    }

    var showConfirm = function() {
      $button = $('<button>Confirm</button>');
      $button.click(function() {
        var data = {
          origin: origin,
          destination: destination,
          kickColor: kickColor
        }
        $.post(gameUrl + '/move', data, function(result) {
          console.log(result);
        }).fail(function(response) {
          alert(response.responseText);
        });
      });
      self.map.setConfirm('Moving - ' + origin + ' => ' + destination + (kickColor ? ', and kicking ' + kickColor : ''), $button);
    }

    // find all the cities that this player has people in
    for (var cityName in self.data.board) {
      if (self.data.board[cityName].traders[player.color] && self.data.board[cityName].index <= player.horseLocation) {
        self.map.$cities[cityName].addClass('mapHoverable');
        self.map.$cities[cityName].bind('click.origin', chooseOrigin);
      }
    }

  };

  Game.prototype.disableEnterButtons = function() {
    $('.enterButton').prop('disabled', true);
  };

  Game.prototype.cancel = function() {
    location.reload();
  }

  Game.prototype.init = function() {
    var self = this;

    if (this.data.phase != 'auction' && this.data.phase != 'income') {
      $('.phaseAuctionSnapshot').show();
    }

    // resolve button
    if (this.data.phase == 'resolve' && this.data.playerIds[this.data.currentPlayerIndex].color == player.color) {
      $('.phaseResolve').show();
    }

    // resolve buttons
    $('.resolveAuctionButton').click(function() {
      var type = $(this).attr('data-src');
      $.post(gameUrl + '/resolveAuction', {buildingType: type}, function(result) {
        console.log(result);
      }).fail(function(response) {
        alert(response.responseText);
      });
    });

    $('#mapMoveButton').click(function() {
      self.enterMoveSequence();
    });

    $('#mapMoveEndButton').click(function() {
      var freeMoves = player.freeMoves;
      var buildables = 0;
      for (var i in player.buildings) {
        buildables += player.buildings[i];
      }
      if ((freeMoves + buildables) && !confirm('You still have moves or buildings, are you sure you want to end?')) {
        return;
      }
      $.post(gameUrl + '/endMove', function(result) {
        console.log(result);
      }).fail(function(response) {
        alert(response.responseText);
      });
    });

    $('.moveBuild').click(function() {
      var buildingType = $(this).attr('data-src');
      self.enterBuildSequence(buildingType)
    })

    // map stuff
    $('.phaseMap').show();
    
    $('#incomePoints').on('input', function() {
      var val = parseInt($(this).val());
      if (isNaN(val) || val != parseInt(val)) {
        return;
      }

      var diff = player.income - val;
      $('#incomeCoins').val(diff);
    });

    $('#incomeCoins').on('input', function() {
      var val = parseInt($(this).val());
      if (isNaN(val) || val != parseInt(val)) {
        return;
      }

      var diff = player.income - val;
      $('#incomePoints').val(diff);
    });

    $('.phaseIncome').find('button').click(function() {
      var points = parseInt($('#incomePoints').val());
      $.post(gameUrl + '/allocateIncome', {points: points}, function(result) {
        console.log(result);
      }).fail(function(response) {
        alert(response.responseText);
      });
    });

    // buttons for past results
    $('#auctionSnapshotButton').click(function() {
      if ($(this).next().is(':visible')) {
        $(this).text('Show Auction Results');
        $(this).next().hide();
      } else {
        $(this).text('Hide Auction Results');
        $(this).next().show();
      }
    });
  };
  window.Game = Game;
})();