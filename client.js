'use strict'

const { PeerRPCClient, PeerSub }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')
const readline = require('readline')
const { uuid } = require('./utils')

const link = new Link({
  grape: 'http://127.0.0.1:30001',
  requestTimeout: 10000
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

// [{ type (bid|ask), amount, price }]
let orderBook = new Map();

const peerSub = new PeerSub(link, {})
peerSub.init()

peerSub.sub('order_sync', { timeout: 10000 })

peerSub.on('message', (msg) => {
  const result = JSON.parse(msg)
  orderBook = new Map([...result])
})

const userId = uuid()

function placeOrder(type, amount, price) {
  const id = uuid();
  const order = {
    type,
    amount,
    price,
  };

  console.log('order added', order);
  orderBook.set(id, order);

  peer.request('order_validation', { id, userId, ...order }, { timeout: 100000 }, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })
}

function askQuestion(query) {
  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
      rl.close();
      resolve(ans.toLowerCase());
  }))
}

console.log({ userId })
console.log('Order format:\ntype(bid|ask) amount(number) price(number)');

(async function handleInput() {
  const answer = await askQuestion('\nPlease place an order, type show or exit:\n');

  if (answer === 'exit') process.exit(1)

  if (answer === 'show') {
    console.log('order book\n', Array.from(orderBook.entries()))

    return handleInput()
  }

  const [type, amount, price] = answer.split(' ')

  placeOrder(type, Number(amount), Number(price))

  handleInput()
})();
