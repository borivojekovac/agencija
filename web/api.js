//import io from 'socket.io-client';

class Api {
    constructor(baseUrl, root = 'api', version = 'v1') {
        this.baseUrl = baseUrl;
        this.root = root;
        this.version = version;
        this.socket = io(baseUrl);
        this.spinnerCount = 0;
        this.ui = {
            spinner: document.getElementById("spinner")
        };
    }

    spinnerOn() {

        if (++this.spinnerCount > 0) {

            this.ui.spinner.classList.add("active");
        }
    }

    spinnerOff() {

        if (Math.max(0, --this.spinnerCount) == 0) {

            this.ui.spinner.classList.remove("active");
        }
    }

    async get(endpoint) {

        try {

            this.spinnerOn();

            const url = `/${this.root}/${this.version}${endpoint}`;

            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'GET',
                headers: {
                    'x-socket-id': this.socket.id
                }
            });

            return response.json();
        }
        finally {
            
            this.spinnerOff();
        }
    }

    async post(endpoint, data) {

        try {

            this.spinnerOn();

            const url = `/${this.root}/${this.version}${endpoint}`;

            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-socket-id': this.socket.id
                },
                body: JSON.stringify(data)
            });

            return response.json();
        }
        finally {

            this.spinnerOff();
        }
    }

    async put(endpoint, data) {

        try {

            this.spinnerOn();

            const url = `/${this.root}/${this.version}${endpoint}`;

            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-socket-id': this.socket.id
                },
                body: JSON.stringify(data)
            });

            return response.json();
        }
        finally {

            this.spinnerOff();
        }
    }

    async delete(endpoint) {

        try {

            this.spinnerOn();

            const url = `/${this.root}/${this.version}${endpoint}`;

            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'DELETE',
                headers: {
                    'x-socket-id': this.socket.id
                }
            });

            return response.json();
        }
        finally {

            this.spinnerOff();
        }
    }

    async patch(endpoint, data) {

        try {

            this.spinnerOn();

            const url = `/${this.root}/${this.version}${endpoint}`;

            const response = await fetch(`${this.baseUrl}${url}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-socket-id': this.socket.id
                },
                body: JSON.stringify(data)
            });

            return response.json();
        }
        finally {

            this.spinnerOff();
        }
    }
}

export default Api;