var blockchain = require('blockchain-account-monitor')

class CodiusBillingBitcoind {

  constructor(codius, bitcoind) {
    this.codius         = codius
    this.bitcoindClient = new blockchain.Client(bitcoind)
    this.billing        = new codius.BillingService()
  }

  processPayments() {
    var _this = this;
    this.getLastPaymentHash().then(function(hash) {

      var monitor = new blockchain.AccountMonitor({
        blockchainClient: _this._bitcoindClient
        onBlock: function(block, next) {
          block.forEach(_this.processPayment)
          next()
        },  
        lastBlockHash: hash
        timeout: 1000
      });

      monitor.start()
    })
  }

  private getLastPaymentHash() {
    return this._codius.Ledger.findOrCreate({
      name: 'bitcoin'
    })
    .fetch(function(ledger) {
      if (ledger.get('last_hash')) {
        return Promise.resolve(ledget.get('last_hash'))
      } else {
        return new Promise(function(resolve, reject) {
          // fetch last block hash from bitcoind
        })
      }
    })
  }

  private processPayment(payment) {
    var _this = this;
    new this.codius.Address({
      network: 'bitcoin',
      address: payment.address
    })
    .fetch().then(function(address) {
      if (address) {
        address.related('token').fetch().then(function(token) {
          _this._billing.credit(token, payment.amount, payment.hash)
        })
      }
    })
  }
}

