import Compiler from "./compiler.js";
import utility from "../utility.js";
import fs from 'fs';
import path from 'path';

function getCommandParameter(name) {

    const args = process.argv.slice(2);
    return args.find(arg => arg.startsWith(name + "="))?.split("=")[1];
}

async function main() {
    
    var agencyToUse = getCommandParameter("agency");

    if (!agencyToUse) {

        console.warn(`Agency not specified, please input agency filename:`);

        while (true) {

            const input = await utility.readline();
            var filename = path.join("..", "agencies", input);
            const ext = path.extname(filename).toLowerCase();
            if (ext !== '.txt') {

                filename = path.join(path.dirname(filename), path.basename(filename, ext) + '.txt');
            }

            if (fs.existsSync(filename)) {
                
                agencyToUse = path.basename(filename, '.txt');;
                break;
            }

            console.warn(`file ${filename} doesn't exist, please input a valid agency filename:`);
        }
    }

    const compiler = new Compiler();
    const outputFileName = await compiler.compile(agencyToUse, true);
}

main();