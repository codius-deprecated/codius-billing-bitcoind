import blockchain from 'blockchain-account-monitor'
import bitcoin from 'bitcoin'
import Promise from 'bluebird'
import Monitor from './monitor'
import Client  from './client'

export default class CodiusBillingBitcoind {

  constructor(codius, bitcoind) {
    this.codius   = codius
    this.bitcoind = Promise.promisifyAll(new bitcoin.Client(bitcoind))
    this.billing  = new codius.BillingService()
    this.client   = new Client(bitcoind)
  }

  registerContract(token) {
    return this.bitcoind.getNewAddressAsync('')
      .then(result => {
        return this.codius.Ledger.findOrCreate({ name: 'bitcoin' })
          .then(function(ledger) {
            return ledger.registerAddress(token, result[0])
          })
      })
  }

  processPayments() {
    this.getLastPaymentHash().then(hash => {

      var monitor = new Monitor({
        client: this.client,
        onBlock: (block, next) => {
          return new Promise(resolve => {
            block.forEach(payment => {
              this.processPayment(payment)
            })
            resolve()
          })
        },  
        lastBlockHash: hash,
        timeout: 1000
      })

      monitor.start()
    })
  }

  getLastPaymentHash() {
    return this.codius.Ledger.findOrCreate({
      name: 'bitcoin'
    })
    .then(ledger => {
      if (ledger.get('last_hash')) {
        return ledger.get('last_hash')
      } else {
        return this.bitcoind.getBlockCountAsync()
          .then(index => {
            return this.bitcoind.getBlockHashAsync(index[0])
              .then(index => index[0])
          })
      }
    })
  }

  processPayment(payment) {
    console.log('PROCESS PAYMENT', payment);
    new this.codius.Address({
      network: 'bitcoin',
      address: payment.address
    })
    .fetch().then(address => {
      if (address) {
        address.related('token').fetch().then(token => {
          this._billing.credit(token, payment.amount, payment.hash)
        })
      }
    })
  }
}

