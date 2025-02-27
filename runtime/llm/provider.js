import { EventEmitter } from 'events';
import log from "../../log.js";

class Provider extends EventEmitter {

    name = null;

    constructor(name) {

        super();

        this.name = name;
    }

    async init() {
    }

    async cleanup() {
    }

    async createAssistant(name, instructions) {

        throw new Error("Not implemented.");
    }

    async createThread() {

        throw new Error("Not implemented.");
    }

    async sendThreadMessage(assistantId, threadId, message, tools) {

        throw new Error("Not implemented.");
    }

    async getResponse(prompt) {

        throw new Error("Not implemented.");
    }

    emit(evt, ...args) {

        super.emit(evt, ...args);

        log.info(evt, ...args);
        Provider.event.emit(evt, ...args);
    }
};

Provider.default = null;
Provider.event = new EventEmitter();

export default Provider;