import { createInMemoryClientWithPeer } from "libcardano/src/helper"
import { Kafka } from "../kafka"
import { ChainTip } from "libcardano/src/types"

const k = new Kafka(["kafka.sireto.dev:9092"], 'blockchain')
const blockchain = createInMemoryClientWithPeer("sanchonet-node.play.dev.cardano.org:3001", 4, false)
blockchain.pipeline("extendBlock", (block, cb) => {
    setImmediate(cb)
    const chainTip: ChainTip = [[block.slotNo, block.headerHash], block.blockNo]
    // k.rollBack('blockchain', chainTip)
    k.rollForward('blockchain', chainTip)
})