import Tab from "./tab.js";

class DefinitionTab extends Tab {

    constructor(app) {

        super(app);
    }

    async init() {

        await super.init();

        this.bind(document, "agencySelected", this.onAgencySelected);
        this.bind(this.ui.updateDefinitionButton, "click", this.onUpdateDefinitionButtonClick);   
        this.bind(this.ui.compileButton, "click", this.onCompileButtonClick);   
    }

    async onAgencySelected(evt) {

        const name = evt.detail.name;
        const agencyElement = document.querySelector(`.agencies-list li[data-id="${name}"]`);
        const definition = agencyElement.dataset.definition;

        document.querySelector("#definitionTab h1").innerText = `${name} Spec`;
        this.ui.agencyDefinition.value = definition;
    }

    async onUpdateDefinitionButtonClick(evt) {

        const agencyElement = this.ui.agenciesList.querySelector(".active");
        const name = agencyElement.dataset.id;

        if (confirm(`Are you sure you want to update ${name} definition?`)) {

            try {

                await this.api.post(`/agency/${name}/definition`, { name: name, definition: this.ui.agencyDefinition.value });
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

    async onCompileButtonClick(evt) {

        const agencyElement = this.ui.agenciesList.querySelector(".active");
        const name = agencyElement.dataset.id;

        if (confirm(`Are you sure you want to (re)compile ${name}?`)) {

            try {

                const agency = await this.api.post(`/agency/${name}/compile`, { name: name, definition: this.ui.agencyDefinition.value });
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

export default DefinitionTab;