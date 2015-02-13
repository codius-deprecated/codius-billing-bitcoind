import _ from 'lodash'
import Promise from 'bluebird'
import bitcoin from 'bitcoin'

export default class Client {
  constructor(options) {
    console.log('new Client', options)
    this.confirmations = options.confirmations
    this.bitcoind = Promise.promisifyAll(new bitcoin.Client(options))
  }

  listNextBlock(previousBlockHash) {
    console.log('listSinceBlock', previousBlockHash)
    return this.bitcoind.listSinceBlockAsync(previousBlockHash)//, String(this.confirmations))
      .then(function(transactions) {
        let transactions = transactions[0].transactions
        console.log('LIST SINCE BLOCK', previousBlockHash, transactions)
        if (!transactions || transactions.length === 0) { return }
        let confirmed = this.filterByMinimumConfirmations(transactions, this.confirmations);
        if (confirmed.length === 0) { return }
        var sorted = this.sortTransactionsByTime(confirmed);
        var nextBlockHash = sorted[0].blockhash;
        return this.transactionsInBlock(sorted, nextBlockHash);
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
      return parseInt(transaction.confirmations) >= confirmations
    })
  }
}
