import Tab from "./tab.js";

class AgenciesTab extends Tab {

    constructor(app) {

        super(app);
    }

    async init() {

        await super.init();
        
        this.updateAgenciesList();

        this.bind(this.ui.agenciesAddButton, "click", this.onAgenciesAddButtonClick);
    }

    async updateAgenciesList() {

        try {

            const currentlySelectedAgencyName = this.getSelectedAgencyName();

            this.ui.agenciesList.innerHTML = "";

            const agencies = await this.api.get("/agency");
            for (const agency in agencies) {

                const container = document.createElement('li');
                container.dataset.id = agency;
                container.dataset.definition = agencies[agency].definition??null;
                container.dataset.compiled = agencies[agency].compiled??null;

                if (currentlySelectedAgencyName == agency) {

                    container.classList.add("active");
                }

                this.bind(container, 'click', this.onAgenciesListClick);
                this.ui.agenciesList.appendChild(container);

                container.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>';
                const svg = container.firstChild;

                const span = document.createElement("span");
                span.innerText = agency;
                container.prepend(span);

                const input = document.createElement("input");
                input.type = "text";
                input.value = agency;
                container.prepend(input);

                this.bind(input, "change", this.onAgencyRename);
                this.bind(svg, "click", this.onAgencyDelete);
            }
        }
        catch (error) {

            this.logError(error);
        }
        finally {            
        }
    }

    async onAgenciesAddButtonClick(evt) {

        try {

            const agency = {
                name: `Untitled Agency ${this.ui.agenciesList.children.length}`,
                definition: `This is a braindead Agent, responding to every prompt with "I don't know".`
            };

            const agencies = await this.api.post("/agency", agency);
        }
        catch (error) {

            this.logError(error);
        }
        finally {
        }

        await this.updateAgenciesList();
    }

    async agencyDelete(agencyElement, name) {

        if (!confirm(`Are you sure you want to delete ${name}?`)) {

            return false;
        }

        await this.api.delete(`/agency/${name}`);
        agencyElement.remove();

        this.app.chatId = null;
        document.body.classList.add("noAgent");
        document.title = "No Agency Loaded";

        return true;
    }

    async onAgencyDelete(evt) {

        const agencyElement = evt.currentTarget.parentElement;
        const name = agencyElement.dataset.id;

        await this.agencyDelete(agencyElement, name);
    }

    async onAgencyRename(evt) {

        try {

            const agencyElement = evt.currentTarget.parentElement;
            const inputElement = evt.currentTarget;
            const name = agencyElement.dataset.id;
            const newName = inputElement.value.trim();

            if (!newName) {

                if (!await this.agencyDelete(agencyElement, name)) {

                    evt.currentTarget.value = name;
                }
            }
            else {

                const result = await this.api.post(`/agency/${name}/rename`, { name: newName });
                agencyElement.dataset.id = result.name;
                inputElement.value = result.name;
                agencyElement.querySelector("span").innerText = result.name;
                this.onAgentLoaded(result.name);
            }
        }
        catch (error) {

            this.logError(error);
        }
        finally {
        }
    }

    onAgentLoaded(name) {

        document.title = name;
    
        const event = new CustomEvent("agencySelected", { detail: { name: name } });
        document.dispatchEvent(event);
    }

    getSelectedAgencyName() {

        const container = document.querySelector(".agencies-list li.active");
        if (!container) {

            return null;
        }

        return container.dataset.id;
    }

    async selectAgency(container) {

        try {

            for (const agencyElement of document.querySelectorAll(".agencies-list li")) {

                agencyElement.classList.remove('active');
            }
            container.classList.add('active');

            const name = container.dataset.id;

            this.onAgentLoaded(name);
            document.body.classList.remove("noAgent");
        }
        catch (error) {

            this.logError(error);
        }
        finally {
        }
    }

    async onAgenciesListClick(evt) {

        try {

            const currentName = this.getSelectedAgencyName();
            const container = evt.currentTarget;

            if (container.dataset.id != currentName) {

                const agencyWasLoadedAlready = !document.body.classList.contains("noAgent");

                await this.selectAgency(container);

                if (!agencyWasLoadedAlready) {

                    if (!container.dataset.compiled) {

                        this.app.activateTab(this.ui.definitionTabButton);
                    }
                    else {

                        this.app.activateTab(this.ui.chatTabButton);
                    }
                }
            }
        }
        catch (error) {

            this.app.chatId = null;
            this.logError(error);
        }
        finally {
        }
    }
}

export default AgenciesTab;