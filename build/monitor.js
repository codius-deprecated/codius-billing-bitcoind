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

var Monitor = (function () {
  function Monitor(options) {
    console.log("LBH", options.lastBlockHash);
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
        console.log("START", hash);
        var self = this;
        return Promise["while"](function () {
          return true;
        }, function () {
          console.log("IN WHILE LOOP", self.lastBlockHash);
          return new Promise(function (resolve) {
            return _this.client.listNextBlock(self.lastBlockHash).then(function (block) {
              console.log("GOOOOT BLOOOK", block);
              if (!block) {
                return resolve();
              }
              _this.onBlock(block).then(function () {
                resolve(self.lastBlockHash = block[0].blockhash);
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