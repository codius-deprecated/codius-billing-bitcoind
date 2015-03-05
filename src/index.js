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
          .then(ledger => {
            return ledger.registerAddress(token, result[0])
          })
      })
  }

  processPayments() {

    return this.codius.Ledger.findOrCreate({
      name: 'bitcoin'
    })
    .then(ledger => {
      this.getLastPaymentHash().then(hash => {

        var monitor = new Monitor({
          client: this.client,
          onBlock: (block, next) => {
            return new Promise(resolve => {
              if (block) {
                block.forEach(payment => {
                  this.processPayment(payment)
                })
              }
              ledger
                .set('last_hash', block[0].blockhash)
                .save()
                .then(()=> {
                  resolve()
                })
            })
          },  
          lastBlockHash: hash,
          timeout: 2000
        })

        monitor.start()
      })
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

    new this.codius.Address({
      address: payment.address
    })
    .fetch().then(address => {
      if (address) {

        address.related('token').fetch().then(token => {
          var CPU = parseFloat(payment.amount) * this.codius.config.get('compute_units_per_bitcoin')
          this.billing.credit(token, CPU)
            .then(credit => {
              this.codius.logger.info('token:credited', token.get('token'), CPU) 
            })
        })
      }
    })
  }
}

