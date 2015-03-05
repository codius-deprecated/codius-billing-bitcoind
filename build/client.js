"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

var _ = _interopRequire(require("lodash"));

var Promise = _interopRequire(require("bluebird"));

var bitcoin = _interopRequire(require("bitcoin"));

var Client = (function () {
  function Client(options) {
    this.confirmations = options.confirmations || 1;
    this.bitcoind = Promise.promisifyAll(new bitcoin.Client(options));
  }

  _prototypeProperties(Client, null, {
    listNextBlock: {
      value: function listNextBlock(previousBlockHash) {
        var _this = this;
        return this.bitcoind.listSinceBlockAsync(previousBlockHash).then(function (transactions) {
          var transactions = transactions[0].transactions;
          if (!transactions || transactions.length === 0) {
            return;
          }
          var confirmed = _this.filterByMinimumConfirmations(transactions, _this.confirmations);
          if (confirmed.length === 0) {
            return;
          }
          var sorted = _this.sortTransactionsByTime(confirmed);
          var nextBlockHash = sorted[0].blockhash;
          return _this.transactionsInBlock(sorted, nextBlockHash);
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    getTransactionBlockHash: {
      value: function getTransactionBlockHash(id) {
        return this.bitcoind.getTransactionAsync(id).then(function (transaction) {
          return Promise.resolve(transaction.blockhash);
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    sortTransactionsByTime: {
      value: function sortTransactionsByTime(transactions) {
        return _.sortBy(transactions, function (transaction) {
          return transaction.blocktime;
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    transactionsInBlock: {
      value: function transactionsInBlock(transactions, blockHash) {
        return _.filter(transactions, function (transaction) {
          return transaction.blockhash === blockHash;
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    filterByMinimumConfirmations: {
      value: function filterByMinimumConfirmations(transactions) {
        var _this2 = this;
        return _.filter(transactions, function (transaction) {
          return parseInt(transaction.confirmations) >= _this2.confirmations;
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return Client;
})();

module.exports = Client;