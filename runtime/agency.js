import Agent from './agent.js';

/**
 * Represents an agency that extends the functionality of an Agent.
 * Primary purpose is to provide a specialised Agent which can delegate work to other agents.
 * At the moment has exact same functionality as Agent (e.g. Agent can also use DelegateTool
 * to delegate work to other Agents), but might be extended in the future.
 */
class Agency extends Agent {

    constructor(params) {

        super(params);
    }

    async init(agencyName) {

        await super.init(agencyName);
    }

    async cleanup() {
        
        await super.cleanup();
    }
};

export default Agency;