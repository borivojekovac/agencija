import Provider from "../../runtime/llm/provider.js";
import OpenAiProvider from "../../runtime/llm/openAiProvider.js";
import ApiDomain from "./apiDomain.js";
import utility from "../../utility.js";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sourceFileExists(agency) {

    var filename = path.join(".", "agencies", agency);
    const ext = path.extname(filename).toLowerCase();
    if (ext !== '.txt') {
        filename = path.join(path.dirname(filename), path.basename(filename, ext) + '.txt');
    }

    return fs.existsSync(filename);
}

class Chat extends ApiDomain {

    agencies = {};

    constructor(api) {

        super(api);
    }

    async init() {

        Provider.default = OpenAiProvider;
        Provider.default.model = "gpt-4o";

        super.init({
            post: {
                "/chat/new/:agency": this.newChat.bind(this),
                "/chat/:id": this.sendMessage.bind(this)
            }
        });

        this.api.io.on('connection', (socket) => {

            if (!this.agencies[socket.id]) {

                this.agencies[socket.id] = {};
            }

            socket.on('disconnect', () => {

                this.cleanupSocketConnection(socket.id);                
            });
        });

        const directory = path.join(__dirname, '../../runtime.tmp');
        const files = await fs.promises.readdir(directory);

        for (let i = 0; i < files.length; i++) {

            const file = files[i];
            const filePath = path.join(directory, file);

            if (path.extname(file) === '.js') {
                try {

                    await fs.promises.unlink(filePath);
                }
                catch (error) {
                }
            }
        }
    }

    async cleanupSocketConnection(socketId) {

        if (this.agencies[socketId]) {

            this.emit("cleanup", {
                name: socketId,
                type: "Socket",
                message: `Releasing socket ${socketId} agents.` });

            for (const assistantId in this.agencies[socketId]) {

                const agency = this.agencies[socketId][assistantId];

                try {

                    await agency.agency.cleanup();
                }
                catch (error) {

                    this.emit("problem", {
                        type: "Agency",
                        name: agency.file,
                        message: error.message??error.toString()
                    });
                }
            }

            delete this.agencies[socketId];
        }
    }

    async cleanup() {

        await super.cleanup();
        
        const socketIds = Object.keys(this.agencies);
        for (const socketId of socketIds) {

            await this.cleanupSocketConnection(socketId);
        }
    }

    async newChat(req, res) {

        const agencyName = req.params.agency;
        const socketId = req.headers['x-socket-id'];

        try {
            
            if (!sourceFileExists(agencyName)) {
    
                throw new Error(`Couldn't find agency file for ${agencyName}.`);
            }

            var filename = path.join(".", "agencies", agencyName);
            const ext = path.extname(filename).toLowerCase();
            if (ext !== '.js') {
                filename = path.join(path.dirname(filename), path.basename(filename, ext) + '.js');
            }

            if (!fs.existsSync(filename)) {

                throw new Error(`Couldn't find compiled agency file for ${agencyName}.`);
            }

            const temporaryName = utility.generateGUID();
            const temporaryFileName = path.join(".", "runtime.tmp", `${temporaryName}.js`);
            const fileContents = await fs.promises.readFile(filename, 'utf8');
            await fs.promises.writeFile(temporaryFileName, fileContents, 'utf8');

            const agency = (await import(`../../runtime.tmp/${temporaryName}.js`)).default;
            await agency.init(agencyName);
    
            if (!this.agencies[socketId]) {

                this.agencies[socketId] = {};
            }

            this.agencies[socketId][agency.assistantId] = {
                file: temporaryFileName,
                agency: agency
            };
    
            res.json({
                id: agency.assistantId
            });
        }
        catch (error) {

            this.emit("problem", {
                type: "Agency",
                name: agencyName,
                message: error.message??error.toString()
            });

            res.status(500).json({ error: error.message ?? error.toString() });
        }
    }

    async sendMessage(req, res) {

        const assistantId = req.params.id;
        const socketId = req.headers['x-socket-id'];
        var agency = null;

        try {
        
            if (!assistantId) {

                throw new Error("Missing id, can't send message. Please use an id obtained by starting a chat.");
            }

            if (!this.agencies[socketId]) {

                this.agencies[socketId] = {};
            }

            if (!this.agencies[socketId][assistantId]) {
               
                throw new Error("Invalid id, can't send message. Please use an id obtained by starting a chat.");
            }
            
            agency = this.agencies[socketId][assistantId].agency;
            if (!agency) {
               
                throw new Error("Invalid id, can't send message. Please use an id obtained by starting a chat.");
            }

            const message = req.body.message;

            const response = await agency.sendMessage(message);

            res.json({
                response: response
            });
        }
        catch (error) {

            this.emit("problem", {
                type: "Agency",
                name: agency||assistantId,
                message: error.message??error.toString()
            });

            res.status(500).json({ error: (error.message|error.message.message) ?? error.toString() });
        }
    }
}

export default Chat;