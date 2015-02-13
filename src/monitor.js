import whileFactory from 'promise-while'
import Promise from 'bluebird'
import Client from './client'

Promise.while = whileFactory(Promise)

export default class Monitor {

  constructor(options) {
    console.log('LBH', options.lastBlockHash)
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
    console.log('START', hash)
    var self = this
    return Promise.while(() => { return true }, () => {
      console.log('IN WHILE LOOP', self.lastBlockHash)
      return new Promise(resolve => {
        return this.client.listNextBlock(self.lastBlockHash).then(block => {
          console.log('GOOOOT BLOOOK', block)
          if (!block) { return resolve() }
          this.onBlock(block).then(() => {
            resolve(self.lastBlockHash = block[0].blockhash)
          })
        })
      })
    })
  }
}

