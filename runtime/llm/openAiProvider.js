import Provider from './provider.js';
import OpenAI from 'openai';
import config from 'config';

var openai = null;
new OpenAI({
    apiKey: config.llmProviders.openAi.apiKey
});

class OpenAiProvider extends Provider {

    model = OpenAiProvider.model;
    assistants = {};
    threads = {};

    constructor() {

        super("OpenAiProvider");
    }

    async init() {

        await super.init();

        if (!OpenAiProvider.openai) {

            OpenAiProvider.openai = new OpenAI({
                apiKey: config.llmProviders.openAi.apiKey
            });

            this.emit("initialised", {
                message: `${this.name} initialised.`,
                name: this.name,
                type: "Provider",
            });
        }
    }

    async cleanup() {

        await super.cleanup();

        for (var threadId in this.threads) {

            try {

                await this.threadsApi().del(threadId);
            }
            catch (error) {

                this.emit("problem", {
                    message: `Thread ${threadId} couldn't be deleted.`,
                    name: threadId,
                    type: "Provider"
                });
            }
        }

        this.threads = {}

        for (var assistantId in this.assistants) {

            var files = null;
            try {

                files = await this.assistantsApi().files.list({ assistant_id: assistantId });
            }
            catch (error) {

                this.emit("problem", {
                    message: `Couldn't get list of files for assistant ${assistantId}.`,
                    name: assistantId,
                    type: "Provider"
                });
            }

            if (files) {

                for (const file of files.data) {

                    try {

                        await this.filesApi().del(file.id);
                    }
                    catch (error) {

                        this.emit("problem", {
                            message: `File ${file.id} couldn't be deleted.`,
                            name: file.id,
                            type: "Provider"
                        });
                    }
                }
            }

            
            try {

                await this.assistantsApi().del(assistantId);
            }
            catch (error) {

                this.emit("problem", {
                    message: `Assistant ${assistantId} couldn't be deleted.`,
                    name: assistantId,
                    type: "Provider"
                });
            }
        }

        this.assistants = {};
    }

    filesApi() {

        return OpenAiProvider.openai.files || OpenAiProvider.openai.beta.files;
    }

    threadsApi() {
        
        return OpenAiProvider.openai.threads || OpenAiProvider.openai.beta.threads;
    }

    assistantsApi() {

        return OpenAiProvider.openai.assistants || OpenAiProvider.openai.beta.assistants;
    }

    async createAssistant(name, instructions, tools) {

        var toolsInfo = [];
        for (const tool of tools) {

            toolsInfo.push(tool.description());
        }

        const assistant = await this.assistantsApi().create({
            name: name,
            instructions: instructions,
            model: this.model,
            tools: toolsInfo
        });

        this.assistants[assistant.id] = assistant;

        this.emit("assistantcreated", {
            message: `Assistant ${name} created.`,
            name: name,
            type: "Provider",
            id: assistant.id,
            model: this.model
        });

        return assistant.id;
    }

    async createThread() {

        const thread = await this.threadsApi().create();

        this.threads[thread.id] = thread;

        this.emit("threadcreated", {
            message: `Thread ${thread.id} created.`,
            name: thread.id,
            type: "Provider"
        });

        return thread.id;
    }

    async sendThreadMessage(assistantId, threadId, message, tools) {

        await this.threadsApi().messages.create(threadId, {
            role: "user",
            content: message,
        });

        const run = await this.threadsApi().runs.create(threadId, {
            assistant_id: assistantId
        });

        this.emit("runcreated", {
            message: `Run ${run.id} created.`,
            name: run.id,
            type: "Provider"
        });

        var lastStatus = null;

        try {

            while (true) {

                const response = await this.threadsApi().runs.retrieve(threadId, run.id);
                lastStatus = response.status;
                switch (response.status) {

                    case "completed":

                        this.emit("runcompleted", {
                            message: `Run ${run.id} completed.`,
                            name: run.id,
                            type: "Provider"
                        });
                        
                        const messages = await this.threadsApi().messages.list(threadId);
                        const assistantResponse = messages.data.find(
                            (msg) => msg.role === 'assistant' && msg.run_id === run.id
                        );

                        return {
                            status: "succeeded",
                            messages: messages.data,
                            response: assistantResponse.content
                        };

                    case "requires_action":

                        switch (response.required_action.type) {

                            case "submit_tool_outputs":

                                const toolCalls = response.required_action.submit_tool_outputs.tool_calls;
                                const toolOutputs = [];
                                for (const tool of toolCalls) {

                                    if (tool.type === "function") {

                                        const functionName = tool.function.name;
                                        const functionArgs = JSON.parse(tool.function.arguments);
                                        
                                        var toolExecuted = false;
                                        for (const availableTool of tools) {

                                            if (availableTool.name.replaceAll(" ", "") === functionName) {

                                                try {
                                                    const functionResult = await availableTool.use(functionArgs);
                                                    toolOutputs.push({
                                                        tool_call_id: tool.id,
                                                        output: JSON.stringify(functionResult),
                                                    });
                                                }
                                                catch (toolError) {

                                                    toolOutputs.push({
                                                        tool_call_id: tool.id,
                                                        output: JSON.stringify({ error: toolError.message }),
                                                    });
                                                }
                                                toolExecuted = true;
                                                break;
                                            }
                                        }

                                        if (!toolExecuted) {

                                            toolOutputs.push({
                                                tool_call_id: tool.id,
                                                output: JSON.stringify({ error: `Tool ${functionName} is not available.`}),
                                            });
                                        }
                                    }
                                }
            
                                await this.threadsApi().runs.submitToolOutputs(
                                    threadId,
                                    run.id, {
                                        tool_outputs: toolOutputs,
                                    }
                                );
                                break;

                            default:
                                throw new Error(`Can't receive assistant's response. Assistant requested an unknown action: ${response.required_action.type}.`);
                        }
                        break;

                    case "failed":
                    case "cancelled":
                    case "expired":
                        throw new Error(`Sending message ${response.status}.`);

                    case "queued":
                        await new Promise((resolve) => setTimeout(resolve, 5000));
                        break;

                    case "in_progress":
                    default:
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        break;
                }
            }
        }
        catch (error) {
            
            this.emit("problem", {
                message: `Run ${run.id} interrupted, last known status ${lastStatus}.`,
                name: run.id,
                type: "Provider"
            });

            try {

                await this.threadsApi().runs.cancel(threadId, run.id);
            }
            catch (error2) {

                this.emit("problem", {
                    message: `Unable to cancel ${run.id}: ${error2.message ?? error2.toString()}.`,
                    name: run.id,
                    type: "Provider"
                });
            }
            
            throw error;
        }
    }

    async getResponse(messages, prompt) {

        try {

            if (!messages) {
                
                messages = [];
            }

            messages.push({ role: "user", content: prompt });

            const response = await OpenAiProvider.openai.chat.completions.create({
                model: "gpt-4",
                messages: messages,
                max_tokens: 200,
            });

            messages.push(response.choices[0].message);

            return response.choices[0].message.content;
        }
        catch (error) {

            throw new Error("Could not get response from OpenAI LLM provider because of OpenAI API error.", error);
        }
    }
};

OpenAiProvider.openai = null;
OpenAiProvider.model = "gpt-4o";

export default OpenAiProvider;