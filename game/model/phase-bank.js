var config = require('../config');

module.exports = function(Game) {
  var buckets = [6, 12, 18, 23, 28, 32, 36, 39, 42, 45, 48, 51, 54, 57, 61, 65, 69, 74, 79, 86, 92, 99]

  Game.prototype.startBankPhase = function() {
    if (this.phase !== 'auction') {
      throw new Error('can only transition from the auction phase');
    }

    this.phase = 'bank';

    this.addLog('bank phase started');

    this.auctionSnapshot = JSON.parse(JSON.stringify(this.auctions));

    if (this.auctions.bank.high || this.auctions.bank.low) {

      // there are people in the bank, lets see what the total auction is

      var total = 0;
      for (var i in this.auctions) {
        if (i !== 'bank') {
          for (var j in this.auctions[i]) {
            if (this.auctions[i][j]) {
              total += parseInt(j);
            }
          }
        }
      }

      var bucketIndex;
      for (bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
        if (total < buckets[bucketIndex]) {
          break;
        }
      }

      var highPayout = bucketIndex + 6;
      var lowPayout = 5 + Math.floor(bucketIndex / 2);

      // lets see who is in the high bank
      if (this.auctions.bank.high) {
        var highRoller = this.players[this.auctions.bank.high];
        highRoller.coins += highPayout;
        this.auctions.bank.high = null;
        highRoller.freeTraders++;
        this.addLog(highRoller, ' gets ' + highPayout + ' from the bank');
      }
      
      if (this.auctions.bank.low) {
        var lowRoller = this.players[this.auctions.bank.low];
        lowRoller.coins += lowPayout;
        this.auctions.bank.low = null;
        lowRoller.freeTraders++;
        this.addLog(lowRoller, ' gets ' + lowPayout + ' from the bank');
      }
    } else {
      this.addLog('no one in bank, so moving on');
    }

    this.startResolvePhase();
  }

}