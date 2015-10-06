var config = require('../config');

module.exports = function(Game) {
  // this also starts the next phase
  Game.prototype.nextPlayer = function() {

    switch(this.phase) {
      case 'auction':
        var original = this.currentPlayerIndex;

        for (var i = 0; i < this.playerIds.length; i++) {
          var testIndex = (this.currentPlayerIndex + i + 1) % this.playerIds.length;
          console.log('testing', testIndex);
          var color = this.playerIds[testIndex].color;
          var player = this.players[color];
          // no good if this person has people in the bank
          if (player.passAuction) {
            continue;
          }

          // no good if this person has no free traders
          console.log('testing traveilng traders', this.getTravelingTraders(player));
          if (player.freeTraders == 0 && this.getTravelingTraders(player) == 0) {
            continue;
          }


          this.currentPlayerIndex = testIndex;
          return;
        }

        // if it reaches here, that means we have failed to find the next player
        this.startBankPhase();
        break;
      case 'resolve':
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex < this.playerIds.length) {
          this.resolveContinue();
        } else {
          this.startMovePhase();
        }
        break;
      case 'move':
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex == this.playerIds.length) {
          this.startInspectorPhase();
        } else {
          this.moveContinue();
        }
        break;
      case 'income':
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex == this.playerIds.length) {
          for (var i in this.players) {
            if (this.players[i].points >= 80) {
              this.phase = 'complete';
              return;
            }
          }
          this.startAuctionPhase();
        } else {
          this.incomeContinue();
        }
        break;
      default:
        throw new Error('unknown phase');
    }
  }
}