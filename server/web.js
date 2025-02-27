import { EventEmitter } from 'events';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

class Web extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;
    }

    async init() {
        // Serve static files from the '../web' folder
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.app.use(express.static(path.join(__dirname, '../web')));
        this.app.use("/markdown", express.static(path.join(__dirname, "../node_modules/markdown/lib/")));
    }
}

export default Web;