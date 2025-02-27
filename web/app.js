import Api from './api.js';
import AgenciesTab from './agenciesTab.js';
import ChatTab from "./chatTab.js";
import DefinitionTab from "./definitionTab.js";
import CompiledTab from "./compiledTab.js";
import MemoryTab from "./memoryTab.js";
import LogTab from "./logTab.js";

class App {
    inited = false;
    ui = {};
    tab = {};
    callbacks = [];
    chatId = null;

    constructor() {
        this.api = null;
    }

    async init(baseUrl) {

        this.api = new Api(baseUrl);

        this.inited = true;

        for (const element of document.querySelectorAll("[id], .dynamic")) {
            this.ui[element.id] = element;
        }
        
        await this.initTabs();
    }

    bind(element, event, callback) {

        const boundCallback = callback.bind(this);
        this.callbacks.push({
            element: element,
            event: event,
            callback: boundCallback
        });
        element.addEventListener(event, boundCallback);
    }

    unbind(element, event) {

        for (callback of this.callbacks) {

            if (callback.element === element && callback.event === event) {

                callback.element.removeEventListener(callback.event, callback.callback);
                this.callbacks.splice(this.callbacks.indexOf(callback), 1);
                break;
            }
        }
    }

    unbindAll() {

        for (callback of this.callbacks) {
            callback.element.removeEventListener(callback.event, callback.callback);
        }

        this.callbacks = [];
    }

    async initTabs() {

        this.tab.agencies = new AgenciesTab(this);        
        this.tab.chat = new ChatTab(this);
        this.tab.definition = new DefinitionTab(this);
        this.tab.compiled = new CompiledTab(this);
        this.tab.memory = new MemoryTab(this);
        this.tab.log = new LogTab(this);

        for (const tab in this.tab) {

            await this.tab[tab].init();
        }

        const tabButtons = document.querySelectorAll('nav button');
        for (const button of tabButtons) {

            this.bind(button, 'click', this.onTabClick);
        }
    }
    
    logError(error) {

        const logElement = document.createElement('li');
        
        const messageElement = document.createElement("span");
        messageElement.classList.add("log-message");
        messageElement.innerText = `Error: ${error.message ?? error.toString()}`;
        logElement.appendChild(messageElement);

        this.ui.logList.insertBefore(logElement, this.ui.logList.firstChild);
    }

    activateTab(button) {

        for (const element of document.querySelectorAll('nav button, .tab-pane')) {

            element.classList.remove('active');
        }
        
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    }

    onTabClick(evt) {

        const button = evt.currentTarget;
        this.activateTab(button);
    }
};

const app = new App();

document.addEventListener('DOMContentLoaded', () => {

    app.init(window.location.origin);    
});

export default app;

