import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';
import Entity from '../../runtime/entity.js';
import Memory from "../../runtime/memory.js";
import Provider from "../../runtime/llm/provider.js";
import Compiler from "../../compiler/compiler.js";
import Agencies from "./agencies.js";
import Chat from "./chat.js";

class Api extends EventEmitter {

    domains = [];

    constructor(express) {
        super();
        this.express = express;
        this.io = null;
        this.root = "api";
        this.version = "v1";
        this.domains.push(new Agencies(this));
        this.domains.push(new Chat(this));
    }

    get(endpoint, handler) {
        const url = `/${this.root}/${this.version}${endpoint}`;
        this.express.get(url, (req, res) => {
            this.emit('request', { method: 'GET', endpoint: url });
            handler(req, res);
            this.emit('response', { method: 'GET', endpoint: url });
        });
    }

    post(endpoint, handler) {
        const url = `/${this.root}/${this.version}${endpoint}`;
        this.express.post(url, (req, res) => {
            this.emit('request', { method: 'POST', endpoint: url, data: req.body });
            handler(req, res);
            this.emit('response', { method: 'POST', endpoint: url, data: req.body });
        });
    }

    put(endpoint, handler) {
        const url = `/${this.root}/${this.version}${endpoint}`;
        this.express.put(url, (req, res) => {
            this.emit('request', { method: 'PUT', endpoint: url, data: req.body });
            handler(req, res);
            this.emit('response', { method: 'PUT', endpoint: url, data: req.body });
        });
    }

    delete(endpoint, handler) {
        const url = `/${this.root}/${this.version}${endpoint}`;
        this.express.delete(url, (req, res) => {
            this.emit('request', { method: 'DELETE', endpoint: url });
            handler(req, res);
            this.emit('response', { method: 'DELETE', endpoint: url });
        });
    }

    patch(endpoint, handler) {
        const url = `/${this.root}/${this.version}${endpoint}`;
        this.express.patch(url, (req, res) => {
            this.emit('request', { method: 'PATCH', endpoint: url, data: req.body });
            handler(req, res);
            this.emit('response', { method: 'PATCH', endpoint: url, data: req.body });
        });
    }

    async init(httpServer, httpsServer) {
        // Create Socket.IO server
        this.io = new SocketIOServer();
        this.io.attach(httpServer);
        this.io.attach(httpsServer);

        // Listen for connections
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Listen for disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        // Forward Entity events to clients
        Entity.event.on('created', (event) => {
            this.io.emit('created', event);
        });

        Entity.event.on('initialised', (event) => {
            this.io.emit('initialised', event);
        });

        Entity.event.on('message', (event) => {
            this.io.emit('message', event);
        });

        Entity.event.on('response', (event) => {
            this.io.emit('response', event);
        });

        Entity.event.on('execute', (event) => {
            this.io.emit('execute', event);
        });

        Entity.event.on('result', (event) => {
            this.io.emit('result', event);
        });

        Entity.event.on('problem', (event) => {
            this.io.emit('problem', event);
        });

        Compiler.event.on("compiling", (event) => {

            this.io.emit('compiling', event);
        });

        Compiler.event.on("bugfixing", (event) => {

            this.io.emit('bugfixing', event);
        });

        Compiler.event.on("compiled", (event) => {

            this.io.emit('compiled', event);
        });

        Memory.event.on("memoryupdated", (event) => {

            this.io.emit('memoryupdated', event);
        });

        Provider.event.on("initialised", (event) => {
        
            this.io.emit('initialised', event);
        });

        Provider.event.on("assistantcreated", (event) => {
        
            this.io.emit('assistantcreated', event);
        });

        Provider.event.on("threadcreated", (event) => {
        
            this.io.emit('threadcreated', event);
        });

        Provider.event.on("runcreated", (event) => {
        
            this.io.emit('runcreated', event);
        });

        Provider.event.on("runcompleted", (event) => {
        
            this.io.emit('runcompleted', event);
        });

        Provider.event.on("problem", (event) => {
        
            this.io.emit('problem', event);
        });

        for (const apiDomain of this.domains) {

            apiDomain.on("cleanup", (event) => {
                this.io.emit('cleanup', event);
            });

            apiDomain.on("problem", (event) => {
                this.io.emit('problem', event);
            });

            apiDomain.on("delete", (event) => {
                this.io.emit('delete', event);
            });
            
            apiDomain.on("create", (event) => {
                this.io.emit('create', event);
            });

            apiDomain.on("update", (event) => {
                this.io.emit('update', event);
            });

            apiDomain.init();
        }
    }

    async cleanup() {

        for (const apiDomain of this.domains) {
            
            await apiDomain.cleanup();
        }
    }

    registerEndpoints(contract) {
        for (const method in contract) {
            for (const endpoint in contract[method]) {
                this[method](endpoint, contract[method][endpoint]);
            }
        }
    }
}

export default Api;