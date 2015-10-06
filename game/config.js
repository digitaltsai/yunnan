var gameConfig = {
  regions: [{
              name: 'PU\'ER',
              income: {
                trader: 3,
                tradingPost: 0
              }
            },
            {
              name: 'YUNNAN',
              income: {
                trader: 6,
                tradingPost: 1
              }
            },
            {
              name: 'SICHUAN',
              presents: 5,
              income: {
                trader: 9,
                tradingPost: 3
              }
            },
            {
              name: 'QAMBDO',
              presents: 4,
              income: {
                trader: 12,
                tradingPost: 6
              }
            },
            {
              name: 'TIBET',
              presents: 3,
              income: {
                trader: 15,
                tradingPost: 10
              }
            },
            {
              name: 'QUINGHAI',
              presents: 2,
              income: {
                trader: 18,
                tradingPost: 15
              }
            }],
  bridges: [{start: 'YUNNAN', end: 'QAMBDO'},
            {start: 'YUNNAN', end: 'TIBET'},
            {start: 'SICHUAN', end: 'QUINGHAI'},
            {start: 'QUAMDO', end: 'QUINGHAI'}],
  validColors: ['red', 'blue', 'purple', 'yellow', 'green']
}

module.exports = gameConfig;