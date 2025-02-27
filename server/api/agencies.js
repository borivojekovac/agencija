import ApiDomain from "./apiDomain.js";
import Compiler from "../../compiler/compiler.js";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Agencies extends ApiDomain {

    constructor(api) {

        super(api);
    }

    async init() {

        super.init({
            get: {
                '/agency': this.getAllAgencies.bind(this),
                '/agency/:id': this.getAgency.bind(this),
                '/agency/:id/memory': this.getMemory.bind(this)
            },
            post: {
                '/agency/:id/compile': this.compileAgency.bind(this),
                '/agency/:id/rename': this.renameAgency.bind(this),
                '/agency/:id/definition': this.updateAgencyDefinition.bind(this),
                '/agency/:id/compiled': this.updateAgencyCompiled.bind(this),
                '/agency/:id/memory': this.updateMemory.bind(this),
                '/agency': this.createAgency.bind(this)
            },
            delete: {
                '/agency/:id': this.deleteAgency.bind(this),
                '/agency/:id/memory': this.clearMemory.bind(this)
            }
        });
    }

    async deleteAgency(req, res) {

        try {

            const name = req.params.id;
            const directoryPath = path.join(__dirname, '../../agencies');

            const compiledPath = path.join(directoryPath, `${name}.js`);
            if (fs.existsSync(compiledPath)) {

                fs.unlinkSync(compiledPath);
            }

            const definitionPath = path.join(directoryPath, `${name}.txt`);
            if (fs.existsSync(definitionPath)) {

                fs.unlinkSync(definitionPath);
            }

            this.emit("delete", {
                name: name,
                type: "Agency",
                message: `Agency ${name} deleted.`
            });

            res.json({
                message: `Agency ${name} deleted successfully.`
            });
        }
        catch (error) {

            res.status(500).json({ error: 'Unable to delete the agency.' });
        }
    }

    async createAgency(req, res) {

        try {

            const agency = req.body;
            const directoryPath = path.join(__dirname, '../../agencies');
        
            if (agency.definition !== undefined) {

                const definitionPath = path.join(directoryPath, `${agency.name}.txt`);
                await fs.promises.writeFile(definitionPath, agency.definition, 'utf8');
            }
            
            if (agency.compiled !== undefined) {
                
                const compiledPath = path.join(directoryPath, `${agency.name}.js`);
                await fs.promises.writeFile(compiledPath, agency.compiled, 'utf8');
            }

            this.emit("create", {
                name: agency.name,
                type: "Agency",
                message: `Agency ${agency.name} created.`
            });
            
            res.json({
                name: agency.name,
                definition: agency.definition ?? null,
                compiled: agency.compiled ?? null
            });
        }
        catch (error) {

            res.status(500).json({ error: 'Unable to create the agency.' });
        }
    }

    async getAllAgencies(req, res) {

        try {

            const directoryPath = path.join(__dirname, '../../agencies');
            const files = await fs.promises.readdir(directoryPath);
            const agencies = {};

            for (const file of files) {

                const name = path.basename(file, path.extname(file));

                switch (path.extname(file).toLowerCase()) {

                    case ".txt":
                        {
                            
                            if (!agencies[name]) { agencies[name] = {}; }
                            const filePath = path.join(directoryPath, file);
                            const fileContents = await fs.promises.readFile(filePath, 'utf8');
                            agencies[name].definition = fileContents;
                            if (!agencies[name].compiled) {
        
                                agencies[name].compiled = "";
                            }
                        }
                        break;

                    case ".js":
                        {
                            if (!agencies[name]) { agencies[name] = {}; }
                            const filePath = path.join(directoryPath, file);
                            const fileContents = await fs.promises.readFile(filePath, 'utf8');
                            agencies[name].compiled = fileContents;
                        }
                        break;
                }
            }
            res.json(agencies);
        }
        catch (err) {

            res.status(500).json({ error: 'Unable to retrieve all agencies.' });
        }
    }

    async constructAgencyObject(name) {

        const directoryPath = path.join(__dirname, '../../agencies');
        const sourceFile = path.join(directoryPath, name + ".txt");
        const compiledFile = path.join(directoryPath, name + ".js");

        const agency = {
            name: name
        };

        if (fs.existsSync(sourceFile)) {

            const fileContents = await fs.promises.readFile(sourceFile, 'utf8');
            agency.definition = fileContents;
        }

        if (fs.existsSync(compiledFile)) {

            const fileContents = await fs.promises.readFile(compiledFile, 'utf8');
            agency.compiled = fileContents;
        }

        return agency;
    }

    async getAgency(req, res) {

        try {

            const name = req.params.id;

            const agency = await this.constructAgencyObject(name);
            
            res.json(agency);
        }
        catch (err) {

            res.status(500).json({ error: 'Unable to retrieve the agency.' });
        }
    }

    async getMemory(req, res) {

        const name = req.params.id;
        
        try {

            const directoryPath = path.join(__dirname, '../../agencies');
            const memoryFile = path.join(directoryPath, name + ".mem");
            const memoryContents = fs.readFileSync(memoryFile, 'utf8');
            const memory = JSON.parse(memoryContents);

            res.json(memory);
        }
        catch (err) {

            res.status(500).json({ error: `Unable to retrieve ${name} agency's memory.` });
        }
    }

    async updateMemory(req, res) {

        const name = req.params.id;
        const memoryContents = req.body.memory;
        
        try {

            const directoryPath = path.join(__dirname, '../../agencies');
            const memoryFile = path.join(directoryPath, name + ".mem");
            const memory = JSON.parse(memoryContents);
            if (!memory.memory) {

                throw new Error("Invalid memory, can't update.");
            }

            fs.writeFileSync(memoryFile, memoryContents);

            res.json(memory);
        }
        catch (err) {

            res.status(500).json({ error: `Unable to update ${name} agency's memory.` });
        }
    }

    async clearMemory(req, res) {

        const name = req.params.id;
        
        try {

            const directoryPath = path.join(__dirname, '../../agencies');
            const memoryFile = path.join(directoryPath, name + ".mem");
            fs.writeFileSync(memoryFile, '{"memory":{}}');
            
            res.json({ memory: {}});
        }
        catch (err) {

            res.status(500).json({ error: `Unable to update ${name} agency's memory.` });
        }
    }

    async updateAgencyDefinition(req, res) {

        try {

            const name = req.params.id;
            const definition = req.body.definition;

            const directoryPath = path.join(__dirname, '../../agencies');
            const sourceFile = path.join(directoryPath, name + ".txt");

            if (fs.existsSync(sourceFile)) {

                fs.unlinkSync(sourceFile);
            }
            await fs.promises.writeFile(sourceFile, definition, 'utf8');

            const agency = await this.constructAgencyObject(name);

            this.emit("update", {
                name: agency.name,
                type: "Agency",
                message: `Agency ${agency.name} definition updated.`
            });

            res.json(agency);
        }
        catch (error) {

            res.status(500).json({ error: 'Unable to update agency definition.' });
        }
    }

    async updateAgencyCompiled(req, res) {

        try {

            const name = req.params.id;
            const compiled = req.body.compiled;

            const directoryPath = path.join(__dirname, '../../agencies');
            const compiledFile = path.join(directoryPath, name + ".js");

            if (fs.existsSync(compiledFile)) {

                fs.unlinkSync(compiledFile);
            }
            await fs.promises.writeFile(compiledFile, compiled, 'utf8');

            const agency = await this.constructAgencyObject(name);

            this.emit("update", {
                name: agency.name,
                type: "Agency",
                message: `Agency ${agency.name} compiled.`
            });

            res.json(agency);
        }
        catch (error) {

            res.status(500).json({ error: 'Unable to update agency compiled code.' });
        }
    }

    async renameAgency(req, res) {

        try {

            const name = req.params.id;
            const newName = req.body.name;

            const directoryPath = path.join(__dirname, '../../agencies');
            const sourceFile = path.join(directoryPath, name + ".txt");
            const compiledFile = path.join(directoryPath, name + ".js");

            if (fs.existsSync(sourceFile)) {

                const newSourceFile = path.join(directoryPath, newName + ".txt");
                fs.promises.rename(sourceFile, newSourceFile);
            }

            if (fs.existsSync(compiledFile)) {

                const newCompiledFile = path.join(directoryPath, newName + ".js");
                fs.promises.rename(compiledFile, newCompiledFile);
            } 

            const memoryFile = path.join(directoryPath, name + ".mem");
            if (fs.existsSync(memoryFile)) {

                const newMemoryFile = path.join(directoryPath, newName + ".mem");
                fs.promises.rename(memoryFile, newMemoryFile);
            }

            const agency = await this.constructAgencyObject(newName);
            res.json(agency);
        }
        catch (error) {

            res.status(500).json({ error: 'Unable to compile the agency.' });
        }
    }

    async compileAgency(req, res) {

        try {

            const name = req.params.id;
            const definition = req.body.definition;

            if (definition) {

                const directoryPath = path.join(__dirname, '../../agencies');
                const sourceFile = path.join(directoryPath, name + ".txt");
    
                if (fs.existsSync(sourceFile)) {
    
                    fs.unlinkSync(sourceFile);
                }
                await fs.promises.writeFile(sourceFile, definition, 'utf8');
            }

            const compiler = new Compiler();
            await compiler.compile(name, true);

            const agency = await this.constructAgencyObject(name);

            res.json(agency);

        }
        catch (error) {

            res.status(500).json({ error: 'Unable to compile the agency.' });
        }
    }
}

export default Agencies;