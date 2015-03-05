import _ from 'lodash'
import Promise from 'bluebird'
import bitcoin from 'bitcoin'

export default class Client {
  constructor(options) {
    this.confirmations = options.confirmations || 1
    this.bitcoind = Promise.promisifyAll(new bitcoin.Client(options))
  }

  listNextBlock(previousBlockHash) {
    return this.bitcoind.listSinceBlockAsync(previousBlockHash)
      .then(transactions => {
        let transactions = transactions[0].transactions
        if (!transactions || transactions.length === 0) { return }
        let confirmed = this.filterByMinimumConfirmations(transactions, this.confirmations);
        if (confirmed.length === 0) { return }
        var sorted = this.sortTransactionsByTime(confirmed);
        var nextBlockHash = sorted[0].blockhash;
        return this.transactionsInBlock(sorted, nextBlockHash);
      })
  }

  getTransactionBlockHash(id) {
    return this.bitcoind.getTransactionAsync(id).then(function(transaction) {
      return Promise.resolve(transaction.blockhash)
    })
  }

  sortTransactionsByTime(transactions) {
    return _.sortBy(transactions, transaction => {
      return transaction.blocktime
    })
  }

  transactionsInBlock(transactions, blockHash) {
    return _.filter(transactions, transaction => {
      return transaction.blockhash === blockHash
    })
  }

  filterByMinimumConfirmations(transactions) {
    return _.filter(transactions, transaction => {
      return parseInt(transaction.confirmations) >= this.confirmations
    })
  }
}
