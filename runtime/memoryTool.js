import Tool from "./tool.js";

/**
 * The MemoryTool class is a tool that allows an Agency to remember information
 * for future reference, or forget previously remembered information. All information
 * remembered by any of th Agents withing an Agency are accessible to all other Agents
 */
class MemoryTool extends Tool {

    memory = null;

    /**
     * Constructs a new instance of the MemoryTool class, which is a tool that allows an Agency to remember information
     * for future reference, or forget previously remembered information. The constructor sets the name of the tool to
     * "memoryTool" and specifies that the "association" and "memory" parameters are required.
     */
    constructor() {

        super({
            name: "memoryTool",
            args: {
                association: true, // required
                memory: true // required
            }
        });
    }

    /**
     * Initializes the MemoryTool instance with the provided owner.
     * @param {object} owner - The owner of the MemoryTool instance.
     */
    async init(owner) {

        super.init(owner);
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name,
                description: "This tool remembers information for future reference, or forgets previously remembered information.",
                parameters: {
                    type: "object",
                    properties: {
                        association: {
                            type: "string",
                            description: "The association to remember the memory by, or to forget the memory of."
                        },
                        memory: {
                            type: "string",
                            description: "Text to memorise. If an empty string is passed, associated memory, if any, is forgotten."
                        }
                    },
                    required: this.required
                }
            }
        };
    }

    /**
     * Executes the MemoryTool by setting or forgetting the provided memory based on the given association.
     * @param {object} params - The parameters for the MemoryTool execution.
     * @param {string} params.association - The association to remember the memory by, or to forget the memory of.
     * @param {string} params.memory - The text to memorize. If an empty string is passed, the associated memory, if any, is forgotten.
     * @returns {string} The association and memory that was set, or an error message if the association was not provided.
     */
    async execute(params) {

        const association = typeof params.association == "string" ? params.association : "";
        const memory = typeof params.memory == "string" ? params.memory : "";

        if (!association) {

            return "Association is required and none was provided, nothing to do.";
        }

        this.owner.memory.set(association, memory);

        return `${association} => ${memory}`;
    }
};

export default MemoryTool;