## LibCardano Kafka

**EXAMPLE USAGE**
create kafka instance with hosts and topic
```ts
const k = new Kafka(["172.31.0.6:3004:9092"], 'blockchain')
```
connect to node
```ts
const blockchain = createInMemoryClientWithPeer("sanchonet-node.play.dev.cardano.org:3001", 4, false)
```
send blocks as rollBack or rollForward 

```ts
blockchain.pipeline("extendBlock", (block, cb) => {
    setImmediate(cb)
    const chainTip: ChainTip = [[block.slotNo, block.headerHash], block.blockNo]
    k.rollBack(chainTip)
    k.rollForward(chainTip)
})
```
to see the sent messages: 
```ts
k.receiveKafkaMessage();
```
to see the blockchain info: 
```ts
k.getBlockInfo()
```
to use inMemoryBlockchain's rollBack function
```ts
async function readBlock() {
    const data = await k.writeBlockchain('blockchain', function () { })
    console.log(data)
}

readBlock().catch((err) => {
    console.log('err');
})
```

