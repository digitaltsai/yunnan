var config = {
  accessToken: {
    secret: 'ID_SERVER_SECRET',
  },

  // idServerUrl: 'http://localhost:3000',
  idServerUrl: 'http://192.168.10.166',

  // callbackUrl: 'http://localhost:3001',
  callbackUrl: 'http://192.168.10.166:3001',
  
  db: {
    mongodb: {
      mongoLabUrl: process.env.MONGOLAB_URI,
      username: '',
      password: '',
      host: 'localhost',
      port: 27017,
      database: 'yunnan',
    }
  }
};

module.exports = config;