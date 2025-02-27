import EventEmitter from "events";
import log from "../log.js";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Represents the memory management functionality for the Agents.
 * This class extends the `EventEmitter` class to provide event-based
 * functionality for observing the agents' memory, and includes an
 * "events" singleton for intercepting events of all the Memory instances.
 */
class Memory extends EventEmitter {

    initialised = false;
    agencyName = null;
    memory = {};

    constructor() {

        super();
    }

    /**
     * Initializes the Memory instance for the specified agency name.
     * This method checks if the instance is already initialized, and if not,
     * it loads the memory, creates a memory file if it doesn't exist, and
     * starts watching the file for updates. When loding and executing an agency
     * only the root Agent or Agency's Memory will be initialised and loaded.
     * All the underlying Agents will reuse the same Memory instance; logic for this
     * is in DelegateTool.
     * @param {string} agencyName - The name of the agency associated with this Memory instance.
     * @returns {Promise<void>}
     */
    async init(agencyName) {

        if (this.initialised) {

            return;
        }

        this.agencyName = agencyName;
        
        this.load();

        const fileName = getFileName(this.agencyName);
        if (!fs.existsSync(fileName)) {

            fs.writeFileSync(fileName, '{"memory":{}}');
        }

        fs.watchFile(fileName, this.onMemoryFileUpdated.bind(this));

        this.initialised = true;
    }

    async cleanup() {

        const fileName = getFileName(this.agencyName);
        if (fs.existsSync(fileName)) {

            fs.unwatchFile(fileName);
        }

        this.initialised = false;
        this.memory = {};
        this.agencyName = null;
    }

    /**
     * Generates a markdown string representation of the memory contents,
     * to be used as a part of LLM instructions.
     * If the memory is empty, an empty string is returned.
     * Otherwise, the instructions include a header and a list of key-value pairs
     * for each memory association.
     * @returns {string} The memory instructions string.
     */
    toInstructions() {

        if (!Object.keys(this.memory).length) {

            return "";
        }

        var memoryInstructions = "\n# Previous Conversations Memory"
        for (const association in this.memory) {

            memoryInstructions += `\n* ${association} => ${this.memory[association]}`;
        }

        memoryInstructions += "\n";

        return memoryInstructions;
    }

    /**
     * Returns a JSON string representation of the memory object.
     * @returns {string} A JSON string containing the memory object.
     */
    get() {

        return JSON.stringify(
            { memory: this.memory }
        );
    }

    /**
     * Sets the memory association with the provided value. If the value is empty of false,
     * the association is deleted from the memory. Otherwise, the association is
     * updated with the new value. After the update, the memory is saved and an
     * event is emitted to notify listeners of the memory update.
     * @param {string} association - The key for the memory association.
     * @param {any} memory - The value to be associated with the key.
     */
    set(association, memory) {

        if (!memory) {

            delete this.memory[association];
        }
        else {

            this.memory[association] = memory;
        }

        this.save();

        this.emit("memoryupdated", {
            message: `${this.agencyName} memory updated.`,
            name: this.agencyName,
            type: "Memory",
            memory: this.memory
        });
    }

    /**
     * Handles the event when the memory file is updated. If the file contents
     * are actually being modified, the memory is reloaded and an event is emitted
     * to notify listeners of the memory update.
     * @param {object} current - The current file information.
     * @param {object} previous - The previous file information.
     * @returns {Promise<void>}
     */
    async onMemoryFileUpdated(current, previous) {

        if (current.mtime === previous.mtime) {

            return;
        }

        await this.load();

        this.emit("memoryupdated", {
            message: `${this.agencyName} memory updated.`,
            name: this.agencyName,
            type: "Memory",
            memory: this.memory
        });
    }

    /**
     * Loads the memory data from the file associated with the current agency.
     * If the file does not exist or cannot be read, an empty memory object is created.
     * @returns {Promise<object>} The loaded memory data.
     */
    async load() {

        try {

            const fileName = getFileName(this.agencyName);
            const memory = fs.readFileSync(fileName, 'utf8');
            this.memory = JSON.parse(memory).memory;
        }
        catch {

            this.memory = {};
        }

        return this.memory;
    }

    /**
     * Saves the current memory data to the file associated with the current agency.
     * If the file write operation fails, the method will silently ignore the error.
     * @returns {Promise<object>} The saved memory data.
     */
    async save() {

        try {

            fs.writeFileSync(
                getFileName(this.agencyName),
                this.get()
            );
        }
        catch {
        }

        return this.memory;
    }

    async onMemoryUpdated() {

        return await this.load();
    }

    emit(evt, ...args) {

        super.emit(evt, ...args);

        log.info(evt, ...args);
        Memory.event.emit(evt, ...args);
    }
}

function getFileName(agencyName) {

    return path.join(__dirname, "../agencies", `${agencyName}.mem`);
}

Memory.event = new EventEmitter();

export default Memory;