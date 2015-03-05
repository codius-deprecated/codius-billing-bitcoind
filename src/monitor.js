import whileFactory from 'promise-while'
import Promise from 'bluebird'
import Client from './client'

Promise.while = whileFactory(Promise)

const TIMEOUT = 3000

export default class Monitor {

  constructor(options) {
    this.lastBlockHash = options.lastBlockHash
    this.client = options.client
    this.timeout = options.timeout || 2000
    this.onBlock = options.onBlock
    this.onError = options.onError || error => {
      console.log('BlockchainAccountMonitor::Error', error)
    }
  }

  start() {
    var hash = this.lastBlockHash
    return Promise.while(() => { return true }, () => {
      return new Promise(resolve => {
        return this.client.listNextBlock(this.lastBlockHash).then(block => {
          if (!block) { return setTimeout(resolve, TIMEOUT) }
          console.log('GOT A BITCOIN BLOCK WITH PAYMENTS', block)
          this.onBlock(block).then(() => {
            let blockHash = block[0].blockhash
            this.lastBlockHash = blockHash
            resolve()
          })
        })
      })
    })
  }
}

