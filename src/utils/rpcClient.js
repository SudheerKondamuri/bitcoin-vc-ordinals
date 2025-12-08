const axios = require('axios');
const config = require('../config');

const rpcClient = axios.create({
  baseURL: `http://${config.rpc.host}:${config.rpc.port}`,
  auth: {
    username: config.rpc.user,
    password: config.rpc.password,
  },
});

module.exports = rpcClient;
