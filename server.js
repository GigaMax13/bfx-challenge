'use strict'

const { PeerRPCServer, PeerPub }  = require('grenache-nodejs-ws')
const Link = require('grenache-nodejs-link')
const { uuid } = require('./utils')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCServer(link, {})
peer.init()

const service = peer.transport('server')
service.listen(1337)

const peerPub = new PeerPub(link, {})
peerPub.init()

const servicePub = peerPub.transport('server')
servicePub.listen(1338)

setInterval(() => {
  link.announce('order_validation', service.port, {})
  link.announce('order_sync', servicePub.port, {})
}, 1000)

// [{ type (bid|ask), amount, price }]
let orderBook = new Map()

function addOrder({ id, ...order }) {
  console.log('Order added:', id)
  orderBook.set(id, order)
}

function remOrder(id) {
  console.log('Order removed:', id)
  orderBook.delete(id)
}

// global mutex instance
let mutex = Promise.resolve()

async function handleOrderMatch(order) {
  mutex = mutex.then(async () => {
    if (!orderBook.size) {
      addOrder(order)
      return
    }

    const removedOrders = [];
    let remainingOrder;

    for (const [key, value] of orderBook.entries()) {
      const { userId, type, amount, price } = remainingOrder ? remainingOrder : order;

      if (userId === value.userId || type === value.type ) continue

      // market order
      if (amount === value.amount && price === value.price) {
        removedOrders.push(key)

        break
      }

      // partially filled orders
      if ((type === 'bid' && price >= value.price) || (type === 'ask' && price <= value.price)) {
        removedOrders.push(key)

        const diff = amount - value.amount;

        if (diff > 0) {
          remainingOrder = {
            id: uuid(),
            userId,
            type,
            amount: diff,
            price,
          }
        } else if (diff < 0) {
          remainingOrder = {
            id: uuid(),
            userId: value.userId,
            type: value.type,
            amount: Math.abs(diff),
            price: value.price,
          }
        }
      }
    }

    if (!removedOrders.length && !remainingOrder) {
      addOrder(order)
      return
    }

    if (removedOrders.length > 0) {
      // console.log({ removedOrders })

      removedOrders.forEach((id) => remOrder(id))
    }

    if (!!remainingOrder) {
      // console.log({ remainingOrder })
      addOrder(remainingOrder)
    }
  }).catch((err) => {
    console.error(err)
  })

  return mutex
}

service.on('request', async (rid, key, payload, handler) => {
  try {
    // console.log({ userId: payload.userId })

    await handleOrderMatch(payload)

    handler.reply(null)

    console.log(Array.from(orderBook.entries()))

    // remove the user id for security reasons :)
    servicePub.pub(JSON.stringify(Array.from(orderBook.entries()).map((entry) => {
      const [key, data] = entry
      const {
        type,
        amount,
        price,
      } = data

      return [
        key,
        {
          type,
          amount,
          price,
        }
      ]
    })))
  } catch (err) {
    handler.reply(err)
    process.exit(1)
  }
})
