import { Consumer, KafkaClient, KeyedMessage, Message, Offset, OffsetFetchRequest, Producer } from "kafka-node";
import { ChainTip } from "libcardano/src/types";
import cbor from 'libcardano/src/lib/cbor';
import { createInMemoryClientWithPeer } from 'libcardano/src/helper'
import { InmemoryBlockchain } from "libcardano/src/InmemoryBlockchain";
import { consumers } from "stream";


export class Kafka {
    client: KafkaClient
    producer: Producer
    receivedMessages: any[] = []
    blockchain: InmemoryBlockchain = new InmemoryBlockchain()
    rollBackPoint: ChainTip = [[0, Buffer.from('0')], 0]
    constructor(hosts: string[]) {
        this.client = new KafkaClient({
            kafkaHost: hosts.join(','),
            maxAsyncRequests: 50
        })
        this.producer = new Producer(this.client, { requireAcks: 1 })
    }
    sendKafkaMessage(topic: string, message: Buffer | { key: Buffer, message: Buffer }, cb?: (err?: any) => void) {
        this.producer.send([{ topic, messages: message instanceof Buffer ? message : new KeyedMessage(message.key, message.message) }], function (err, data) {
            if (err) { console.error('Error producing message:', err) }
            else { console.log("Messaage Sent") }
            if (cb) { cb(err) }
        })
    }
    async receiveKafkaMessage(topic: string, cb?: (err?: any, message?: any) => void) {
        const consumer = new Consumer(this.client, [{ topic: topic, partition: 0, offset: 0 }], { fromOffset: true })
        consumer.on('message', (message) => {
            this.receivedMessages.push(message)
            console.log(message)
            if (cb) { cb(undefined, message) }
        })
    }
    async getBlockInfo(topic: string) {
        return new Promise((resolve, reject) => {
            const kafkaData = new Consumer(this.client, [{ topic: topic, partition: 0, offset: 0 }], { fromOffset: true, encoding: 'buffer', keyEncoding: 'buffer' })
            kafkaData.on('message', (message) => {
                const key = (message.key instanceof Buffer) ? cbor.decode(message.key) : null;
                if (message.value instanceof Buffer) {
                    const chainPoint = cbor.decode(message.value)
                    console.log("blockNo:", chainPoint.get('blockNo'), "\thash:", chainPoint.get('headerHash').toString('hex'), "\tslotNo:", chainPoint.get('slotNo'))
                }
            })
        })
    }
    async rollForward(topic: string, tip: ChainTip) {
        const eventData = cbor.encode({ blockNo: tip[1], slotNo: tip[0][0], headerHash: tip[0][1] })
        const rollForwardData = { key: cbor.encode("rollForward"), message: eventData }
        this.sendKafkaMessage(topic, rollForwardData)
    }
    async rollBack(topic: string, tip: ChainTip) {
        const eventData = cbor.encode({ blockNo: tip[1], slotNo: tip[0][0], headerHash: tip[0][1] })
        const rollBackData = { key: cbor.encode("rollBack"), message: eventData }
        this.sendKafkaMessage(topic, rollBackData)
    }
    async writeBlockchain(topic: string, cb: (err?: any) => void): Promise<Boolean> {
        const latestRollBack = await this.getLatestTip(topic, 'rollForward')
        const latestTip = await this.getLatestTip(topic, 'rollBack')
        return this.blockchain.rollBack(latestRollBack[0], latestTip[0], cb)
    }
    async getLatestTip(topic: string, key: string): Promise<ChainTip> {
        return new Promise((resolve, reject) => {
            const kafkaData = new Consumer(this.client, [{ topic: topic, partition: 0, offset: 0 }], { fromOffset: true, encoding: 'buffer', keyEncoding: 'buffer' })
            kafkaData.on('message', (message) => {
                const key = (message.key instanceof Buffer) ? cbor.decode(message.key) : null;
                if (message.value instanceof Buffer && key === key) {
                    const chainPoint = cbor.decode(message.value);
                    this.rollBackPoint = [[chainPoint.get('slotNo'), chainPoint.get('headerHash')], chainPoint.get('blockNo')];
                    if (message.offset === (message.highWaterOffset ? message.highWaterOffset - 1 : null)) {
                        console.log("latest")
                        kafkaData.close(true, (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(this.rollBackPoint);
                            }
                        })
                    }
                }
            })
        })
    }
    shutDown() {
        this.client.close()
    }
}




