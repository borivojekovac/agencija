import Entity from "./entity.js";

/**
 * Represents a tool that extends the base Entity class.
 * Tools are used by Agents to perform various actions within the application.
 */
class Tool extends Entity {

    owner = null;

    /**
     * Initializes the Tool instance with the provided parameters.
     * @param {Object} params - The parameters object.
     * @param {Object} params.args - The arguments for the Tool.
     */
    constructor(params) {

        super(params);
        
        this.args = params && params.args;

        this.required = [];
        for (const task in this.args) {

            if (this.args[task]) {

                this.required.push(task);
            }
        }
    }

    /**
     * Initializes the Tool instance with the provided owner.
     * @param {Object} owner - The owner of the Tool instance.
     */
    async init(owner) {

        this.owner = owner;
    }

    async describe() {

        throw new Error("Not implemented");
    }

    /**
     * Maps provided parameters based on the Tool's required spec,
     * executes the tool and provides event notifications for observing.
     * Finally returns the result of executing the Tool. Inherited classes
     * implement execute method, and this one is a wrapper around it adding
     * additional robustness and observability, and is internally used to
     * invoke execute of the innherited class, instead of invoking execute
     * directly.
     * @param {Object} params - The parameters object.
     * @returns {Promise<any>} - The result of executing the Tool.
     */
    async use(params) {

        var argsToUse = {};
        for (var key in this.args) {

            if (params && params[key]) {

                argsToUse[key] = params[key];
            }
            else {

                argsToUse[key] = this.args[key];
            }
        }

        this.emit("execute", {
            message: `${this.name} executing...`,
            type: this.type,
            name: this.name,
            args: argsToUse
        });

        const result = await this.execute(argsToUse);

        this.emit("result", {
            message: `${this.name} successfully executed.`,
            type: this.type,
            name: this.name,
            args: params.args,
            result: result
        });
        
        return result;
    }

    /**
     * Implemented by inherited classes to provide the functionality of the Tool.
     */
    async execute(params) {

        throw new Error("Not implemented");
    }
}

export default Tool;