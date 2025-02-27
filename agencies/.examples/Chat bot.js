import Agent from "../runtime/agent.js";

const agent = new Agent({
    name: "usefulAssistant",
    capabilities: "Can engage in informative and helpful conversations on a wide array of topics.",
    instructions: "You are a Useful Assistant, dedicated to providing insightful and helpful responses to user prompts across a variety of subjects. Always strive to be informative, articulate, and genuinely helpful.",
    tools: []
});

export default agent;