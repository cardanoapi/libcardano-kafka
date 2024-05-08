## LibCardano Kafka

**EXAMPLE USAGE**

```ts
const k = new Kafka(["kafka.sireto.dev:9092"])
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
    k.rollBack('blockchain', chainTip)
    k.rollForward('blockchain', chainTip)
})
```
to see the sent messages: 
```ts
k.receiveKafkaMessage('blockchain');
```
to see the blockchain info: 
```ts
k.getBlockInfo('blockchain')
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

