import Entity from "./runtime/entity.js";
import log from "./log.js";
import Provider from "./runtime/llm/provider.js";
import OpenAiProvider from "./runtime/llm/openAiProvider.js";
import Compiler from "./compiler/compiler.js"
import utility from "./utility.js";
import path from "path";
import fs from "fs";

function onCreated(event) {

    log.info("created", event);
    console.log(`\tcreated\t${event.type}, ${event.name}`);
}

function onInitialised(event) {

    log.info("initialised", event);
    console.log(`\tinitialised\t${event.type}, ${event.name}`);
}

function onMessage(event) {

    log.info("message", event);
    console.log(`\tmessage\t${event.type}, ${event.name}, ${event.assistantId}, ${event.threadId}, ${event.message}`);
}

function onResponse(event) {

    log.info("response", event);
    console.log(`\tresponse\t${event.type}, ${event.name}, ${event.assistantId}, ${event.threadId}, ${event.response}`);
}

function onExecute(event) {

    log.info("execute", event);

    var args = "";
    for (const arg in event.args??{}) {

        args += `, ${arg}=${event.args[arg]}`;
    }
    
    console.log(`\texecute\t${event.type}, ${event.name}${args}`);
}

function onResult(event) {

    log.info("result", event);
    console.log(`\tresult\t${event.type}, ${event.name}, ${JSON.stringify(event.result)}`);
}

function onCompiling(event) {

    log.info("compiling", event);
    console.log(`\tcompiling\t${event.source}, ${event.model}, ${event.provider}`);
}

function onCompiled(event) {

    log.info("compiled", event);
    console.log(`\tcompiled\t${event.source}, ${event.target}, ${event.model}, ${event.provider}`);
}

function onProblem(event) {

    log.info("problem", event);
    console.log(`\tproblem\t${event.type}, ${event.name}, ${event.problem}`);
}

function getCommandParameter(name) {

    const args = process.argv.slice(2);
    return args.find(arg => arg.startsWith(name + "="))?.split("=")[1];
}

function sourceFileExists(agency) {

    var filename = path.join(".", "agencies", agency);
    const ext = path.extname(filename).toLowerCase();
    if (ext !== '.txt') {
        filename = path.join(path.dirname(filename), path.basename(filename, ext) + '.txt');
    }

    return fs.existsSync(filename);
}

async function inputAgencyFromConsole() {

    console.warn(`Agency not specified, please input an agency filename:`);

    while (true) {

        var input = path.join(".", "agencies", await utility.readline());

        const ext = path.extname(input).toLowerCase();
        if (ext !== '.txt') {
            input = path.join(path.dirname(input), path.basename(input, ext) + '.txt');
        }
    
        if (fs.existsSync(input)) {
            
            return path.basename(input, '.txt');
        }

        console.warn(`Agency ${input} doesn't exist, please input a valid agency name:`);
    }
}

async function main() {

    Entity.event.on("created", onCreated);
    Entity.event.on("initialised", onInitialised);
    Entity.event.on("message", onMessage);
    Entity.event.on("response", onResponse);
    Entity.event.on("execute", onExecute);
    Entity.event.on("result", onResult);
    Entity.event.on("problem", onProblem);
    
    Provider.default = OpenAiProvider;
    Provider.default.model = "gpt-4o";

    var agencyToUse = getCommandParameter("agency");

    if (!agencyToUse || !sourceFileExists(agencyToUse)) {

        console.warn(`Couldn't find agency file for ${agencyToUse}.`);
        agencyToUse = null;
    }

    if (!agencyToUse) {

        agencyToUse = await inputAgencyFromConsole();
    }

    const compiler = new Compiler();
    compiler.on("compiling", onCompiling);
    compiler.on("compiled", onCompiled);
    
    await compiler.compile(agencyToUse);

    const agency = (await import(`./agencies/${agencyToUse}.js`)).default;

    await agency.init(agencyToUse);

    console.log(`Enter a request for ${agency.name} (type 'quit' to quit):`);
    
    while (true) {

        const input = await utility.readline();

        if (input.toLowerCase() === "quit") {

            break;
        }

        try {

            const response = await agency.sendMessage(input);
            console.log(" > " + response);
        }
        catch (error) {

            return `Unable to respond: ${error.message ?? error.toString()}`;
        }
    }

    await agency.cleanup();

    console.log("Engine has stopped.");
}

main();