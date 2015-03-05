"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

var blockchain = _interopRequire(require("blockchain-account-monitor"));

var bitcoin = _interopRequire(require("bitcoin"));

var Promise = _interopRequire(require("bluebird"));

var Monitor = _interopRequire(require("./monitor"));

var Client = _interopRequire(require("./client"));

var CodiusBillingBitcoind = (function () {
  function CodiusBillingBitcoind(codius, bitcoind) {
    this.codius = codius;
    this.bitcoind = Promise.promisifyAll(new bitcoin.Client(bitcoind));
    this.billing = new codius.BillingService();
    this.client = new Client(bitcoind);
  }

  _prototypeProperties(CodiusBillingBitcoind, null, {
    registerContract: {
      value: function registerContract(token) {
        var _this = this;
        return this.bitcoind.getNewAddressAsync("").then(function (result) {
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


        return this.codius.Ledger.findOrCreate({
          name: "bitcoin"
        }).then(function (ledger) {
          _this2.getLastPaymentHash().then(function (hash) {
            var monitor = new Monitor({
              client: _this2.client,
              onBlock: function (block, next) {
                return new Promise(function (resolve) {
                  if (block) {
                    block.forEach(function (payment) {
                      _this2.processPayment(payment);
                    });
                  }
                  ledger.set("last_hash", block[0].blockhash).save().then(function () {
                    resolve();
                  });
                });
              },
              lastBlockHash: hash,
              timeout: 2000
            });

            monitor.start();
          });
        });
      },
      writable: true,
      enumerable: true,
      configurable: true
    },
    getLastPaymentHash: {
      value: function getLastPaymentHash() {
        var _this3 = this;
        return this.codius.Ledger.findOrCreate({
          name: "bitcoin"
        }).then(function (ledger) {
          if (ledger.get("last_hash")) {
            return ledger.get("last_hash");
          } else {
            return _this3.bitcoind.getBlockCountAsync().then(function (index) {
              return _this3.bitcoind.getBlockHashAsync(index[0]).then(function (index) {
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
        var _this4 = this;


        new this.codius.Address({
          address: payment.address
        }).fetch().then(function (address) {
          if (address) {
            address.related("token").fetch().then(function (token) {
              var CPU = parseFloat(payment.amount) * _this4.codius.config.get("compute_units_per_bitcoin");
              _this4.billing.credit(token, CPU).then(function (credit) {
                _this4.codius.logger.info("token:credited", token.get("token"), CPU);
              });
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