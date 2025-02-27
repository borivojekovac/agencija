import Tab from "./tab.js";

class CompiledTab extends Tab {

    constructor(app) {

        super(app);
    }

    async init() {

        await super.init();
        
        this.bind(document, "agencySelected", this.onAgencySelected);
        this.bind(this.ui.updateCompiledButton, "click", this.onUpdateCompiledButtonClick);
    }

    async onAgencySelected(evt) {

        const name = evt.detail.name;
        const agencyElement = document.querySelector(`.agencies-list li[data-id="${name}"]`);
        const compiled = agencyElement.dataset.compiled;

        document.querySelector("#compiledTab h1").innerText = `${name} Code`;
        this.ui.agencyCompiled.value = compiled;
    }

    async onUpdateCompiledButtonClick(evt) {

        const agencyElement = this.ui.agenciesList.querySelector(".active");
        const name = agencyElement.dataset.id;

        if (confirm(`Are you sure you want to update ${name} compilation?`)) {

            try {

                await this.api.post(`/agency/${name}/compiled`, { name: name, compiled: this.ui.agencyCompiled.value });
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

export default CompiledTab;