import { Kafka } from "./kafka";

const k = new Kafka(["kafka.sireto.dev:9092"], 'blockchain')
k.getBlockInfo()

