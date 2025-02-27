import Tab from "./tab.js";

class LogTab extends Tab {

    constructor(app) {

        super(app);
    }

    async init() {

        await super.init();

        this.onServerEvent("created", this.onServerSideEvent);
        this.onServerEvent("initialised", this.onServerSideEvent);
        this.onServerEvent("message", this.onServerSideEvent);
        this.onServerEvent("response", this.onServerSideEvent);
        this.onServerEvent("execute", this.onServerSideEvent);
        this.onServerEvent("result", this.onServerSideEvent);
        this.onServerEvent("problem", this.onServerSideEvent);
        this.onServerEvent("compiling", this.onServerSideEvent);
        this.onServerEvent("compiled", this.onServerSideEvent);
        this.onServerEvent("memoryupdated", this.onServerSideEvent);
        this.onServerEvent("assistantcreated", this.onServerSideEvent);
        this.onServerEvent("threadcreated", this.onServerSideEvent);
        this.onServerEvent("runcreated", this.onServerSideEvent);
        this.onServerEvent("runcompleted", this.onServerSideEvent);


        this.bind(this.ui.logClearButton, "click", this.onLogClearButtonClick);   
    }

    onServerEvent(event, handler) {

        this.api.socket.on(event, handler.bind(this, event));
    }

    async onServerSideEvent(eventName, event) {

        const logElement = document.createElement('li');
        
        const messageElement = document.createElement("span");
        messageElement.classList.add("log-message");
        messageElement.innerText = `${((event.name)??(event.type))??(event.provider)} | ${(event.type??event.provider)} | ${eventName}`;
        logElement.appendChild(messageElement);

        const detailsElement = document.createElement("span");
        detailsElement.classList.add("log-details");

        if (event.fullResponse) {

            detailsElement.innerText = "" + event.fullResponse;
        }
        else if (event.fullMessage) {

            detailsElement.innerText = "" + event.fullMessage;
        }
        else if (event.result) {

            detailsElement.innerText = JSON.stringify(event.result);
        }
        else if (event.message) {

            detailsElement.innerText = "" + event.message;
        }
        else {

            detailsElement.innerText = event.toString();
        }

        if (event.args) {

            for (const key in event.args) {

                detailsElement.innerHTML += `<br/>${key}: ${event.args[key]}`;
            }
        }

        logElement.appendChild(detailsElement);

        this.ui.logList.insertBefore(logElement, this.ui.logList.firstChild);
    }
    
    async onLogClearButtonClick(evt) {

        this.ui.logList.innerHTML = "";
    }
}

export default LogTab;