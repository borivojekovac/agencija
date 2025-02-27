import _readline from 'readline';



export default {

    readline: async function readline(question) {

        const rl = _readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question(question??"", (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    },
    generateGUID: function generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0; // random number between 0 and 15
            var v = c === 'x' ? r : (r & 0x3 | 0x8); // for 'y', set bits 6-7 to '10'
            return v.toString(16);
        });
    }
};