import Provider from "../runtime/llm/provider.js";
import OpenAiProvider from "../runtime/llm/openAiProvider.js";
import Agent from "../runtime/agent.js";
import utility from "../utility.js";
import { EventEmitter } from "events";
import fs from 'fs';
import path from 'path';

class Compiler extends EventEmitter {

    constructor() {

        super();
    }

    async compile(agencyFileName, forceCompile) {
    
        Provider.default = OpenAiProvider;
        Provider.default.model = "gpt-4";

        var moduleName = "../agencies/" + path.join(`${path.basename(agencyFileName, path.extname(agencyFileName))}.js`);
        const sourceFilename = path.join(".", "agencies", `${path.basename(agencyFileName, path.extname(agencyFileName))}.txt`);
        const sourceFileContents = fs.readFileSync(sourceFilename, 'utf8');

        const outputFilename = path.join(".", "agencies", `${path.basename(agencyFileName, path.extname(agencyFileName))}.js`);

        this.emit("compiling", {
            type: "Compiler",
            message: `Compiling ${path.basename(agencyFileName, path.extname(agencyFileName))}...`,
            source: sourceFilename,
            target: outputFilename,
            model: Provider.default.model,
            provider: Provider.default.name
        });
    
        if (fs.existsSync(outputFilename)) {
            
            try {
    
                if (forceCompile) {
    
                    fs.unlinkSync(outputFilename);
                }
                else {
    
                    await import(moduleName);
    
                    return outputFilename;
                }
            }
            catch (error) {
    
                fs.unlinkSync(outputFilename);
            }
        }

        const developerAgent = new Agent({
            name: "Developer Agent",
            instructions: getInstructions("developer instructions.txt"),
            tools: []
        });
    
        var compiledModule = null;

        try {

            await developerAgent.init();

            compiledModule = await developerAgent.sendMessage(sourceFileContents);
            compiledModule = compiledModule.replaceAll("```js","").replaceAll("```","");
        }
        finally {

            await developerAgent.cleanup();
        }

        var attempts = 3;
        while (attempts-- > 0) {

            var compileError = null;

            const temporaryName = utility.generateGUID();

            try {

                const temporaryFileName = path.join(".", "runtime.tmp", `${temporaryName}.js`);
                fs.writeFileSync(temporaryFileName, compiledModule);

                const temporaryModuleName = `../runtime.tmp/${temporaryName}.js`;
                const agency = (await import(temporaryModuleName)).default;
                await agency.init();
                await agency.cleanup();
            }
            catch (error) {

                compileError = error;
            }

            if (!compileError) {

                break;
            }

            const debuggerAgent = new Agent({
                name: "Debugger Agent",
                instructions: getInstructions("debugger instructions.txt"),
                tools: []
            });

            var message = `# Human Language Specification
\`\`\`text
${sourceFileContents}
\`\`\`

# Your implementation
\`\`\`js
${compiledModule}
\`\`\`

# Bug Discovered in Your Implementation
\`\`\`text
Message: ${compileError.message}
Stack Trace: ${compileError.stack}
\`\`\`
`;
                    
            this.emit("bugfixing", {
                type: "Compiler",
                message: `Fixing error discovered in the program: ${compileError.message}`,
                source: sourceFilename,
                target: outputFilename,
                model: Provider.default.model,
                provider: Provider.default.name,
                module: compiledModule
            });

            try {

                await debuggerAgent.init();

                compiledModule = await debuggerAgent.sendMessage(message);
                compiledModule = compiledModule.replaceAll("```js","").replaceAll("```","");
            }
            finally {

                await debuggerAgent.cleanup();
            }
        }

        fs.writeFileSync(outputFilename, compiledModule);

        this.emit("compiled", {
            type: "Compiler",
            message: `Succesfully compiled ${path.basename(agencyFileName, path.extname(agencyFileName))}.`,
            source: sourceFilename,
            target: outputFilename,
            model: Provider.default.model,
            provider: Provider.default.name,
            module: compiledModule
        });
    
        return outputFilename;
    }

    emit(evt, ...args) {

        super.emit(evt, ...args);
        Compiler.event.emit(evt, ...args);
    }
}

function getFile(filename) {
    
    var filepath = path.join(".", "compiler", "agencies", filename);
    const ext = path.extname(filepath).toLowerCase();
    const filecontents = fs.readFileSync(filepath, 'utf8');

    return {
        name: filename,
        path: filepath,
        ext: ext,
        contents: filecontents
    };
}

function getInstructions(instructionsFile) {

    var instructions = getFile(instructionsFile);

    return instructions.contents.replace(/\[file:"(.*?)"\]/g, (match, filename) => {

        const file = getFile(filename);
        var filetype = null;
        switch (file.ext) {

            case "js": filetype = "javascript"; break;
            case "txt": filetype = "text"; break;
            default: filetype = "file"; break;
        }

        return `\`\`\`${filetype}
${file.contents}
\`\`\`
`;
        });
};

Compiler.event = new EventEmitter();

export default Compiler;