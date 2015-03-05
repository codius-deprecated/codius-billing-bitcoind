"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

var whileFactory = _interopRequire(require("promise-while"));

var Promise = _interopRequire(require("bluebird"));

var Client = _interopRequire(require("./client"));

Promise["while"] = whileFactory(Promise);

var TIMEOUT = 3000;

var Monitor = (function () {
  function Monitor(options) {
    this.lastBlockHash = options.lastBlockHash;
    this.client = options.client;
    this.timeout = options.timeout || 2000;
    this.onBlock = options.onBlock;
    this.onError = options.onError || function (error) {
      console.log("BlockchainAccountMonitor::Error", error);
    };
  }

  _prototypeProperties(Monitor, null, {
    start: {
      value: function start() {
        var _this = this;
        var hash = this.lastBlockHash;
        return Promise["while"](function () {
          return true;
        }, function () {
          return new Promise(function (resolve) {
            return _this.client.listNextBlock(_this.lastBlockHash).then(function (block) {
              if (!block) {
                return setTimeout(resolve, TIMEOUT);
              }
              console.log("GOT A BITCOIN BLOCK WITH PAYMENTS", block);
              _this.onBlock(block).then(function () {
                var blockHash = block[0].blockhash;
                _this.lastBlockHash = blockHash;
                resolve();
              });
            });
          });
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Monitor;
})();

module.exports = Monitor;