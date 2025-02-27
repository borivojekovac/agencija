import Tool from "./tool.js";

/**
 * Represents a Tool that can be used by an Agent to delegate a task to another Agent.
 */
class DelegateTool extends Tool {

    /**
     * Constructs a new DelegateTool instance with the provided agent.
     * @param {Agent} agent - The agent that will be used to delegate tasks.
     */
    constructor(agent) {

        super({
            name: agent.name,
            args: {
                "task": true, // required
                "details": false
            }
        });

        this.agent = agent;
    }

    /**
     * Initializes the DelegateTool instance with the provided owner.
     * @param {any} owner - The owner of the DelegateTool instance.
     * @returns {Promise<void>} - A Promise that resolves when the initialization is complete.
     */
    async init(owner) {

        super.init(owner);

        this.agent.owner = owner;
        
        await this.agent.init(owner.agencyName);
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name.replaceAll(" ", ""),
                description: `Delegates a task to ${this.agent.name} agent, which has the following capabilities. ${this.agent.capabilities}`,
                parameters: {
                    type: "object",
                    properties: {
                      task: {
                        type: "string",
                        description: "The specific task to delegate."
                      },
                      details: {
                        type: "string",
                        description: "Additional details for the task."
                      },
                    },
                    required: this.required
                }
            }
        };
    }

    /**
     * @typedef {Object} DelegateParams
     * @property {string} task - The task to delegate
     * @property {string} [details] - Optional task details
     */

    /**
     * Invokes the underlying agent with provided task and optional details, then returns the response.
     *
     * @param {DelegateParams} params - The parameters for the delegated task.
     * @param {string} params.task - The task to delegate.
     * @param {string} [params.details] - Optional additional details for the task.
     * @returns {Promise<string>} - The response from the delegated task.
     */
    async execute(params) {

        const task = params.task;
        const details = params.details;

        const response = await this.agent.sendMessage(
            details
                ? `# task to execute\r\n${task}\r\n\r\n# task details\r\n${details}`
                : task
        );

        return response;
    }
};

export default DelegateTool;