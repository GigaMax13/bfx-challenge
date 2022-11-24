![image](https://user-images.githubusercontent.com/1591993/203871973-c7d968b4-cc50-445c-9544-f99805cdfc83.png)

## Setup:

### Setting up the DHT

```bash
npm i -g grenache-grape
```

### Boot two grape servers
```bash
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Server
```bash
node server.js
```

### Clients
```bash
node client.js
```

## Client commands

### Adding a new order
The order command follows the pattern: `type(bid|ask) amount(number) price(number)`.

Example:
```
bid 12 2
bid 7 1.99
ask 5 1.98
ask 15 1.99
```

### Showing all the orders on the client's orderbook
```bash
show
```

### Closing a client instance
```bash
exit
```

## Limitations and issues
- The user needs to enter the orders manually or through a non provided script. Sorry!
- There's no enforcement for a first-in-first-out (FIFO) or pro-rata algorithm to match orders. It kind works with a FIFO approach because of the way I'm using the map to store the orders but changes on the code may change it.
- By times constraints I only tested running one instance of the server, Im not sure if it's possible to run multiple instances on different ports. Also I didn't read all the grape servers documentation so...
- Im not sure if it's right to mix `PeerRPCServer` with `PeerPub` and `PeerRPCClient` with `PeerSub` but it worked fine. Although I don't think it's the best way to do that.
- The `mutex` implementation on the server is kind ugly but works to ensure no race conditions between different clients sending orders at same time for the same server. Again it could be an issue if running multiple servers instances.
