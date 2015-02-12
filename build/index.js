"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var blockchain = require("blockchain-account-monitor");
var bitcoin = require("bitcoin");
var Promise = require("bluebird");

var CodiusBillingBitcoind = (function () {
  function CodiusBillingBitcoind(codius, bitcoind) {
    bitcoind.https = false;
    this.codius = codius;
    this.bitcoindClient = Promise.promisifyAll(new bitcoin.Client(bitcoind));
    this.coinDaemon = new blockchain.Client(bitcoind);
    this.billing = new codius.BillingService();
  }

  _prototypeProperties(CodiusBillingBitcoind, null, {
    registerContract: {
      value: function registerContract(token) {
        var _this = this;
        return this.bitcoindClient.getNewAddressAsync("").then(function (result) {
          return _this.codius.Ledger.findOrCreate({ name: "bitcoin" }).then(function (ledger) {
            return ledger.registerAddress(token, result[0]);
          });
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    processPayments: {
      value: function processPayments() {
        var _this2 = this;
        this.getLastPaymentHash().then(function (hash) {
          console.log("START POLLING AT", hash);

          var monitor = new blockchain.AccountMonitor({
            blockchainClient: _this2.coinDaemon,
            onBlock: function (block, next) {
              block.forEach(function (payment) {
                _this2.processPayment(payment);
              });
              next();
            },
            lastBlockHash: hash,
            timeout: 1000
          });

          monitor.start();
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    getLastPaymentHash: {
      value: function getLastPaymentHash() {
        var _this3 = this;
        var _this = this;
        return this.codius.Ledger.findOrCreate({
          name: "bitcoin"
        }).then(function (ledger) {
          if (ledger.get("last_hash")) {
            return ledger.get("last_hash");
          } else {
            return _this3.bitcoindClient.getBlockCountAsync().then(function (index) {
              return _this3.bitcoindClient.getBlockHashAsync(index[0]).then(function (index) {
                return index[0];
              });
            });
          }
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    processPayment: {
      value: function processPayment(payment) {
        console.log("PROCESS PAYMENT", payment);
        var _this = this;
        new this.codius.Address({
          network: "bitcoin",
          address: payment.address
        }).fetch().then(function (address) {
          if (address) {
            address.related("token").fetch().then(function (token) {
              _this._billing.credit(token, payment.amount, payment.hash);
            });
          }
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    }
  });

  return CodiusBillingBitcoind;
})();

module.exports = CodiusBillingBitcoind;