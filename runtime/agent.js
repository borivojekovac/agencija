import Entity from './entity.js';
import Provider from './llm/provider.js';
import Memory from './memory.js';
import MemoryTool from "./memoryTool.js";

/**
 * Represents an agent that interacts with the system.
 * The Agent class extends the Entity class and provides functionality
 * for managing the agent's state, including its LLM provider, instructions,
 * capabilities, memory, and tools.
 */
class Agent extends Entity {

    agencyName = null;
    llmProvider = null;
    instructions = null;
    capabilities = null;
    memory = null;
    tools = [];

    constructor(params) {

        super(params);

        this.llmProvider = (params && params.llmProvider) || this.llmProvider || new Provider.default();
        this.instructions = (params && params.instructions) || this.instructions;
        this.capabilities = (params && params.capabilities) || this.capabilities;
        this.tools = (params && params.tools) || this.tools;
    }

    /**
     * Initializes the Agent instance with the provided agency name.
     * This method sets up the LLM provider, memory, and tools for the agent.
     * It creates an assistant and a thread with the LLM provider, and emits an
     * "initialised" event with information about the agent's setup.
     *
     * @param {string} agencyName - The name of the agency the agent belongs to.
     * @returns {Promise<void>} - A Promise that resolves when the initialization
     * is complete.
     */
    async init(agencyName) {

        if (!this.llmProvider) {

            throw new Error(`${this.type} can't initialise Agent because llmProvider is not set.`);
        }

        this.agencyName = agencyName;

        if (this.owner) {

            this.memory = this.owner.memory;
        }
        else {

            this.memory = new Memory();
            await this.memory.init(agencyName);
        }

        this.tools.push(new MemoryTool());

        const toolNames = [];
        for (const tool of this.tools) {

            await tool.init(this);
            toolNames.push(tool.name);
        }

        await this.llmProvider.init();

        this.assistantId = await this.llmProvider.createAssistant(this.name, this.instructions + this.memory.toInstructions(), this.tools);
        this.threadId = await this.llmProvider.createThread(this.assistantId);

        this.emit("initialised", {
            message: `${this.name} initialised.`,
            name: this.name,
            type: this.type,
            assistantId: this.assistantId,
            threadId: this.threadId,
            llmProvider: this.llmProvider.name,
            instructions: this.instructions,
            capabilities: this.capabilities,
            tools: toolNames
        });
    }
    
    async cleanup() {

        if (!this.owner) {

            this.memory.cleanup();
        }
        else {

            this.owner = null;
        }
        this.memory = null;

        for (var i = this.tools.length - 1; i >= 0; i--) {

            if (this.tools[i] instanceof MemoryTool) {

                this.tools.splice(i, 1);
            }
        }

        await this.llmProvider.cleanup();
        this.assistantId = null;
        this.threadId = null;
        
        this.agencyName = null;
    }

    /**
     * Sends a message to the agent's LLM provider and returns the response.
     *
     * @param {string} message - The message to send to the agent.
     * @returns {Promise<string>} - The response from the agent.
     * @throws {TypeError} - If the message is not a non-empty string.
     * @throws {Error} - If an internal problem occurs while processing the message.
     */
    async sendMessage(message) {
        
        if (!message || typeof message !== 'string') {
            throw new TypeError('Message must be a non-empty string');
        }

        this.emit("message", {
            message: `Message to ${this.name}, ${message.substring(0, 10)}...`,
            name: this.name,
            type: this.type,
            assistantId: this.assistantId,
            threadId: this.threadId,
            fullMessage: message
        });

        try {

            const result = await this.llmProvider.sendThreadMessage(
                this.assistantId,
                this.threadId,
                message,
                this.tools
            );
    
            const response = responseToText(result.response);
    
            this.emit("response", {
                message: `Response from ${this.name}, ${response.substring(0, 10)}...`,
                name: this.name,
                type: this.type,
                assistantId: this.assistantId,
                threadId: this.threadId,
                fullMessage: message,
                fullResponse: response
            });
    
            return response;
        }
        catch (error) {

            this.emit("problem", {
                message: `${this.name} ran into a problem: ${error.message ?? error.toString()}`,
                name: this.name,
                type: this.type,
                assistantId: this.assistantId,
                threadId: this.threadId
            });

            return `Unable to respond, due to an internal problem: ${error.message}`;
        }
    }};

/**
 * Extracts the text content from a OpenAI API's response object.
 * 
 * The response object is expected to be an array of message objects,
 * where each message object has a `type` property that can be either
 * "text" or "image". This function will concatenate the `text.value`
 * property of all "text" messages and return the resulting string.
 * 
 * @param {object[]} response - The response object, which is expected to be an array of message objects.
 * @returns {string} The text content extracted from the response.
 */
function responseToText(response) {

    if (!Array.isArray(response)) {
        
        return '';
    }

    var text = "";
    for (const message of response) {

        switch (message.type) {
            
            case "text":
                text += message.text.value;
                break;

            case "image":
                break;
        }
    }

    return text;
};

export default Agent;