import { EventEmitter } from "events";

class ApiDomain extends EventEmitter {

    api = null;

    constructor(api) {

        super();

        this.api = api;
    }

    async init(contract) {

        this.api.registerEndpoints(contract);
    }

    async cleanup() {
    }
};

export default ApiDomain;