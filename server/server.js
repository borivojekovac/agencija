import config from 'config';
import express from 'express';
import cors from "cors";
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import Api from './api/api.js';
import Web from './web.js';
import App from "./app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Server extends EventEmitter {
    constructor() {
        super();
        this.express = express();
        this.httpServer = null;
        this.httpsServer = null;
        this.api = new Api(this.express);
        this.web = new Web(this.express);
        this.app = new App(this.api);
        this.errorHandlers = {};
    }

    async init() {
        // Middleware to parse JSON bodies, handle cross-origin requests and to limit request size
        this.express.use(express.json());
        this.express.use(cors());
        this.express.use(express.json({ strict: false, limit: config.server.maxRequestSize }));

        // Create HTTP and HTTPS servers
        const httpsOptions = {
            key: fs.readFileSync(path.join(__dirname, 'certs', config.server.httpsKey)),
            cert: fs.readFileSync(path.join(__dirname, 'certs', config.server.httpsCertificate))
        };

        this.httpServer = http.createServer(this.express);
        this.httpsServer = https.createServer(httpsOptions, this.express);

        // Initialize Web
        await this.web.init();

        // Initialize API
        await this.api.init(this.httpServer, this.httpsServer);

        // Initialise App
        await this.app.init();
    }

    unhandledRejectionHandler(reason, promise) {

        this.emit('problem', { type: "Unhandled rejection", message: reason.message, stack: reason.stack });
    }

    unhandledExceptionHandler(error, origin) {

        this.emit('problem', { type: "Unhandled exception", message: error.message, stack: error.stack, origin: origin });
    }

    async run() {
        const httpPort = config.server.httpPort || process.env.HTTP_PORT || 8000;
        const httpsPort = config.server.httpsPort ||process.env.HTTPS_PORT || 8443;

        this.errorHandlers.unhandledRejectionHandler = this.unhandledRejectionHandler.bind(this);
        process.on("unhandledRejection", this.errorHandlers.unhandledRejectionHandler);

        this.errorHandlers.unhandledExceptionHandler = this.unhandledExceptionHandler.bind(this);
        process.on("uncaughtException", this.errorHandlers.unhandledExceptionHandler);

        this.httpServer.listen(httpPort, () => {
            console.log(`HTTP server running on port ${httpPort}`);
            this.emit('server-started', { protocol: 'http', port: httpPort });
        });

        this.httpsServer.listen(httpsPort, () => {
            console.log(`HTTPS server running on port ${httpsPort}`);
            this.emit('server-started', { protocol: 'https', port: httpsPort });
        });

        // Block execution until stop is requested
        await new Promise((resolve) => {
            this.once('stop', resolve);
        });
    }

    async stop() {

        if (this.errorHandlers.unhandledRejectionHandler) {

            process.removeListener("unhandledRejection", this.errorHandlers.unhandledRejectionHandler);
            delete this.errorHandlers.unhandledRejectionHandler;
        }

        if (this.errorHandlers.unhandledExceptionHandler) {

            process.removeListener("uncaughtException", this.errorHandlers.unhandledExceptionHandler);
            delete this.errorHandlers.unhandledExceptionHandler;
        }

        this.api.cleanup();

        if (this.httpServer) {
            this.httpServer.close(() => {
                console.log('HTTP server stopped');
                this.emit('server-stopped', { protocol: 'http' });
            });
        }

        if (this.httpsServer) {
            this.httpsServer.close(() => {
                console.log('HTTPS server stopped');
                this.emit('server-stopped', { protocol: 'https' });
            });
        }

        this.emit('stop');
    }
}

export default Server;