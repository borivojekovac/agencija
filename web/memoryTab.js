import Tab from "./tab.js";

class MemoryTab extends Tab {

    constructor(app) {

        super(app);
    }

    async init() {

        await super.init();
        
        this.bind(document, "agencySelected", this.onAgencySelected);
        this.bind(this.ui.clearMemoryButton, "click", this.onClearMemoryButtonClick);
        this.bind(this.ui.updateMemoryButton, "click", this.onUpdateMemoryButtonClick);

        this.api.socket.on("memoryupdated", this.onMemoryUpdated.bind(this));
    }

    async onMemoryUpdated(evt) {

        if (evt.name == this.agencyName) {

            this.ui.agencyMemory.value = JSON.stringify(evt.memory, null, "\t");
        }
    }

    async onAgencySelected(evt) {

        this.agencyName = evt.detail.name;

        const memory = await this.api.get(`/agency/${this.agencyName}/memory`);
        this.ui.agencyMemory.value = JSON.stringify(memory.memory, null, "\t");

        document.querySelector("#memoryTab h1").innerText = `${this.agencyName} Memory`;
    }

    async onUpdateMemoryButtonClick(evt) {

        const agencyElement = this.ui.agenciesList.querySelector(".active");
        const name = agencyElement.dataset.id;

        if (confirm(`Are you sure you want to update ${name} memory?`)) {

            try {

                await this.api.post(`/agency/${name}/memory`, { name: name, memory: `{"memory":${this.ui.agencyMemory.value}}` });
                await this.app.tab.agencies.updateAgenciesList();
                await this.app.tab.agencies.selectAgency(this.ui.agenciesList.querySelector(`[data-id="${name}"]`));
            }
            catch (error) {
    
                this.logError(error);
            }
            finally {
            }
        }        
    }

    async onClearMemoryButtonClick(evt) {

        const agencyElement = this.ui.agenciesList.querySelector(".active");
        const name = agencyElement.dataset.id;

        if (confirm(`Are you sure you want to delete ${name} memory?`)) {

            try {

                await this.api.delete(`/agency/${name}/memory`);
                await this.app.tab.agencies.updateAgenciesList();
                await this.app.tab.agencies.selectAgency(this.ui.agenciesList.querySelector(`[data-id="${name}"]`));
            }
            catch (error) {
    
                this.logError(error);
            }
            finally {
            }
        }        
    }
}

export default MemoryTab;