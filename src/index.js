var blockchain = require('blockchain-account-monitor')
var bitcoin    = require('bitcoin')
var Promise    = require('bluebird')

export default class CodiusBillingBitcoind {

  constructor(codius, bitcoind) {
    bitcoind.https = false
    this.codius         = codius
    this.bitcoindClient = Promise.promisifyAll(new bitcoin.Client(bitcoind))
    this.coinDaemon     = new blockchain.Client(bitcoind)
    this.billing        = new codius.BillingService()
  }

  registerContract(token) {
    return this.bitcoindClient.getNewAddressAsync('')
      .then(result => {
        return this.codius.Ledger.findOrCreate({ name: 'bitcoin' })
          .then(function(ledger) {
            return ledger.registerAddress(token, result[0])
          }) 
      })
  }

  processPayments() {
    this.getLastPaymentHash().then(hash => {
      console.log('START POLLING AT', hash)

      var monitor = new blockchain.AccountMonitor({
        blockchainClient: this.coinDaemon,
        onBlock: (block, next) => {
          block.forEach(payment => {
            this.processPayment(payment)
          })
          next()
        },  
        lastBlockHash: hash,
        timeout: 1000
      })

      monitor.start()
    })
  }

  getLastPaymentHash() {
    var _this = this
    return this.codius.Ledger.findOrCreate({
      name: 'bitcoin'
    })
    .then(ledger => {
      if (ledger.get('last_hash')) {
        return ledger.get('last_hash')
      } else {
        return this.bitcoindClient.getBlockCountAsync()
          .then(index => {
            return this.bitcoindClient.getBlockHashAsync(index[0])
              .then(index => index[0])
          })
      }
    })
  }

  processPayment(payment) {
    console.log('PROCESS PAYMENT', payment);
    var _this = this;
    new this.codius.Address({
      network: 'bitcoin',
      address: payment.address
    })
    .fetch().then(address => {
      if (address) {
        address.related('token').fetch().then(token => {
          _this._billing.credit(token, payment.amount, payment.hash)
        })
      }
    })
  }
}

