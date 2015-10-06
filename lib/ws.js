module.exports = {
  attach: attach,
  gameAlert: gameAlert
}

var gameLinks = {};

function gameAlert(gameId, message) {
  if (gameLinks[gameId]) {
    for (var i in gameLinks[gameId]) {
      gameLinks[gameId][i].ws.send(message);
    }
  }
}

function attach(wss) {
  var websockets = [];
  var nextIndex = 0;

  wss.on("connection", newConnectionHandler);

  function newConnectionHandler(ws) {
    // lets see which game they are 

    while (websockets[nextIndex]) {
      nextIndex++;

      if (nextIndex == 10000) {
        nextIndex = 0;
      }
    }

    var container = {
      index: nextIndex,
      ws: ws,
      handshakeTimeout: null
    }

    websockets[container.index] = container;

    var handshakeTimeout = setTimeout(function() {
      ws.send('disconnected');
      ws.close();
    }, 3000);

    container.handshakeTimeout = handshakeTimeout;

    ws.send('success');

    ws.on('message', function(data) {
      // first step
      try {
        data = JSON.parse(data);
      } catch(e) {

      } 
      
      if (!container.gameId && data.gameId) {
        var gameId = data.gameId;
        if (!gameLinks[gameId]) {
          gameLinks[gameId] = {};
        }
        gameLinks[gameId][container.index] = container;
        container.gameId = data.gameId;

        clearTimeout(container.handshakeTimeout);
        delete container.handshakeTimeout;
      }
    });

    ws.on('close', function() {
      if (container.handshakeTimeout) {
        clearTimeout(container.handshakeTimeout);
      }
      if (container.gameId && gameLinks[container.gameId]) {
        if (gameLinks[container.gameId][container.index]) {
          delete gameLinks[container.gameId][container.index];
        }
        if (Object.keys(gameLinks[container.gameId]) == 0) {
          delete gameLinks[container.gameId];
        }
      }

      if (websockets[container.index]) {
        delete websockets[container.index];
      }
    });
  }
};