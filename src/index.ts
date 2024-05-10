import { Kafka } from './kafka';
import { Blockchain } from "libcardano/src/types";
import cbor, { encodeOne } from "cbor";

export function install_kafka_subscriber(kafka: Kafka, blockchain: Blockchain) {
    blockchain.pipeline("extendBlock", (event, cb) => {
        kafka.sendKafkaMessage('sancho_block', {
            key: Buffer.from(''),
            message: encodeOne(event.body)
        }, cb)
    })
    blockchain.pipeline("rollback", (from, to, cb) => {
        kafka.sendKafkaMessage('sancho_block', {
            key: encodeOne([0, from, to]),
            message: Buffer.from('')
        }, cb)
    })
}
