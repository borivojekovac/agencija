import Server from './server.js';
import utility from '../utility.js';

async function main() {
    const server = new Server();

    server.on('server-started', (event) => {
        console.log(`Server started: ${event.protocol} on port ${event.port}`);
    });

    server.on('server-stopped', (event) => {
        console.log(`Server stopped: ${event.protocol}`);
    });

    server.on('request', (event) => {
        console.log(`Request received: ${event.method} ${event.endpoint}`);
    });

    server.on('response', (event) => {
        console.log(`Response sent: ${event.method} ${event.endpoint}`);
    });

    server.on('problem', (event) => {
        console.log(`Problem: ${event.message} ${event.origin??""}, stack: ${event.stack}`);
    });

    await server.init();
    server.run(); // Do not await here to prevent blocking

    console.log("Server is running. Type 'quit' to stop the server.");

    while (true) {
        const input = await utility.readline();

        if (input.toLowerCase() === "quit") {
            break;
        }

        console.log(`Unknown command: ${input}`);
    }

    console.log("Stopping server...");
    await server.stop();
    console.log("Server has stopped.");
}

main();