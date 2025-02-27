class App {
    constructor(api) {
        this.api = api;
    }

    async init() {

        // Handle socket.io events
        this.api.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.on('example-event', (data) => {
                console.log('Example event received:', data);
                socket.emit('example-response', { message: 'Example response from server' });
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
}

export default App;