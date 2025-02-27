import Tab from "./tab.js";

class ChatTab extends Tab {

    constructor(app) {

        super(app);
    }

    async init() {

        await super.init();

        this.bind(document, "agencySelected", this.onAgencySelected);
        this.bind(this.ui.userMessage, "keydown", this.onUserMessageKeyDown);
        this.bind(this.ui.sendButton, "click", this.onSendButtonClick);   
    }

    async onAgencySelected(evt) {

        const name = evt.detail.name;

        document.querySelector("#chatTab h1").innerText = `Chat with ${name}`;

        const result = await this.api.post(`/chat/new/${name}`);
            
        this.ui.chatMessages.innerHTML = "";
        if (result.error) {

            this.appendChatMessage(`Unable to start chat with ${name}, most likely it hasn't been compiled yet, or there's a problem with compiled code.`, "system-message");
        }

        this.app.chatId = result.id;

    }

    appendChatMessage(message, type) {

        const messageElement = document.createElement('div');
        messageElement.classList.add(type);

        var messageToAdd = message;

        try {

            messageToAdd = marked.parse(message);
        }
        catch {

        }

        messageElement.innerHTML = messageToAdd;
        this.ui.chatMessages.appendChild(messageElement);
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    async onSendButtonClick(evt) {

        try {

            if (!this.app.chatId) {

                return;
            }

            const userMessage = this.ui.userMessage.value;
            this.appendChatMessage(userMessage, "user-message");
            this.ui.userMessage.value = "";

            const result = await this.api.post(`/chat/${this.app.chatId}`, {
                message: userMessage
            });
            this.appendChatMessage(result.response, "agent-message");
        }
        catch (error) {

            this.logError(error);
        }
        finally {
        }
    }

    async onUserMessageKeyDown(event) {

        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            this.onSendButtonClick(event);
        }
    }
}

export default ChatTab;