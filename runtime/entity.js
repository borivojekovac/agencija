import { EventEmitter } from "events";
import log from "../log.js";

/**
 * Represents an entity in the agentic framework.
 * Extends the `EventEmitter` class to provide event-based functionality,
 * and includes "events" singleton for intercepting all the events
 * raised by any instance of Entity or its subclasses.
 */
class Entity extends EventEmitter {

    /**
     * @param {Object} params - Entity initialization parameters
     * @param {string} [params.name] - Optional name of the entity
     * @fires Entity#created
     */
    constructor(params) {

        super();
        if (params && typeof params !== 'object') {
            throw new TypeError('params must be an object');
        }
        this.name = params?.name;
        this.type = this.constructor.name;

        this.emit("created", {
            message: `${this.name} created.`,
            name: this.name,
            type: this.type
        });
    }

    emit(evt, ...args) {

        super.emit(evt, ...args);

        log.info(evt, ...args);
        Entity.event.emit(evt, ...args);
    }
};

Entity.event = new EventEmitter();

export default Entity;