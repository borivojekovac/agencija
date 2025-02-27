# 1. Introduction

The **Agency** platform enables developers to write **human-readable** "source code" that describes AI-driven Agents and Agencies. These Agents and Agencies can use Large Language Models (LLMs), Tools (wrappers around external APIs or computation), and hierarchical messaging to perform sophisticated tasks. 

Developers write this source code in Markdown (or plain text with minimal markup). A **Compiler** then processes it—often leveraging an LLM itself—into a **strictly structured JSON** representation called the **Agency Model**. Finally, a **Runtime** executes the Agency Model, loading Agents, Tools, and Agencies, persisting memory, and exposing an API/CLI for interactions.

---

# 2. Core Concepts

## 2.1 Entities

There are three fundamental entity types in Agency:

1. **Tool**
2. **Agent**
3. **Agency**

Each entity has its own responsibilities and lifecycle. All three are described in more detail below.

### 2.1.1 Tool

- Encapsulates logic for accessing **external systems** (e.g., REST APIs, databases, file systems).
- Implements custom Node.js code that typically involves using external libraries or calling out to APIs.
- Presents a strict JSON request/response interface to the rest of the Agency system.
- Is declared in a `.tool` file (in human language), which the compiler translates into:
  - JSON model metadata (in the Agency Model).
  - Node.js code implementing the external interface.

### 2.1.2 Agent

- Receives messages from a parent entity (either an Agency or another Agent).
- Utilizes LLM prompts to generate structured JSON responses describing **the next action**:
  1. **Recall from memory**  
  2. **Update memory**  
  3. **Use a tool**  
  4. **Communicate with other Agents or Agencies**  
  5. **Request a decision from the parent entity**  
  6. **Return a final response**  
- Maintains two types of **memory**:
  - **Static Memory**: Developer-defined content that is “imprinted” onto every chain of thought and cannot be autonomously changed by the agent.
  - **Volatile Memory**: Persisted across the agent’s lifetime (even across restarts). The agent can autonomously choose to update or recall from it.
- May **inherit** another Agent, enabling extension and reuse of core functionalities.
- Has a **human-like name** and a **title**, used by other Agents/Agencies to direct messages.

### 2.1.3 Agency

- **Externally** behaves like an Agent: it receives a message and returns a response.  
- **Internally** may contain multiple Agents and/or sub-Agencies.  
- **Executive Agent**: A special Agent responsible for receiving incoming messages to the Agency, coordinating internal Agents and Tools, and compiling a final response.  
- Has its own **static memory** that is imprinted onto every incoming message (similar to an Agent’s static memory).  
- Lists:
  - Contained Agents (with names, roles).  
  - Contained sub-Agencies.  
  - Tools available in the Agency.  

---

# 3. Pipeline

## 3.1 Source Code Authoring

1. Developer writes **human-language** source code in Markdown files (with extensions `.agency`, `.agent`, `.tool`). 
2. The structure is **loosely** enforced, focusing on readability and minimal markup.

## 3.2 Compilation

1. A **Compiler** processes the folder structure containing `.agency`, `.agent`, and `.tool` files.  
2. The Compiler uses an LLM (or other parsing methods) to interpret each file’s free-form text.  
3. It validates correctness, reporting **warnings** or **errors** if the specification is ambiguous or incomplete.  
4. It outputs a single **strictly formatted JSON file** called the **Agency Model**. This file captures all Agents, Tools, Agencies, and their properties/methods in a structured form.

## 3.3 Runtime Execution

1. The **Runtime** takes the Agency Model (JSON) as input.  
2. It dynamically **instantiates** the described Agents, Tools, and Agencies.  
3. It sets up **memory management** using the configured NoSQL middleware (filesystem, MongoDB, etc.).  
4. It exposes a **REST API** (in a style similar to OpenAI’s) or a CLI, which can be used to send messages to the top-level Agency.  
5. The top-level Agency (or its **Executive Agent**) handles incoming messages, coordinates with Agents, Tools, or sub-Agencies, and returns a final response.

---

# 4. Folder Structure

A typical project layout:

```
my-agency/
  ├── MyAgency.agency              <-- Agency definition (Executive Agent included or references)
  ├── AgentAlice.agent             <-- Example Agent
  ├── MyCustomTool.tool            <-- Example Tool
  ├── AnotherAgent.agent
  ├── SubAgency/
  │   ├── SubAgency.agency
  │   ├── SubAgent.agent
  │   ├── SubTool.tool
  └── ...
```

- **Top-level folder** (e.g., `my-agency`) represents the root Agency that interacts with end-users.  
- Additional subfolders each contain one **sub-Agency** definition plus any Agents or Tools in that sub-Agency.  
- Each **Agent** is defined in its own `.agent` file.  
- Each **Tool** is defined in its own `.tool` file.  
- Each **Agency** is defined in a `.agency` file, listing its contained Agents, Tools, and sub-Agencies.

---

# 5. High-Level Architecture

Below is a conceptual diagram of the system flow:

```
 Source Code          Compiler           Agency Model           Runtime
 (Markdown)   --->   (Node.js/LLM)   --->   (JSON)     --->   (Node.js)  
                                                              + Memory
                                                              + REST API/CLI
```

1. **Authoring**: Developer writes .agency, .agent, .tool files.  
2. **Compilation**: The Compiler constructs the Agency Model JSON.  
3. **Runtime**:
   - Loads the Agency Model.  
   - Instantiates all Tools and Agents.  
   - Handles messaging events, using LLM prompts (for Agents).  
   - Persists memory via a NoSQL mechanism.  

---

# 6. Simple Scenario Example

Consider a scenario where a user wants a top-level Agency that can:
1. Provide weather information.
2. Offer a friendly greeting through an executive agent.

We have:

- **Agency**: “WeatherAgency”
  - **Executive Agent**: “FrontDeskAgent” (receives messages from external users)
  - **Agent**: “WeatherAgent” (specialized in looking up weather)
  - **Tool**: “WeatherTool” (integration with a hypothetical weather API)

## 6.1 Example Source Code

Below is an example of what the human-language source code might look like:

### `WeatherAgency.agency`

```
# Agency Name: WeatherAgency
Our purpose is to provide weather updates to users and greet them politely.

## Static Memory
We are WeatherAgency. We handle user greetings and weather information.

## Executive Agent
The executive agent is FrontDeskAgent.

## Agents
- WeatherAgent (Helps retrieve weather information)

## Tools
- WeatherTool

```

### `FrontDeskAgent.agent`

```
# Agent Name: FrontDeskAgent
Title: Front Desk

## Inheritance
No inheritance. This agent is specialized for direct user interaction.

## Static Memory
You are FrontDeskAgent, the main interface for the WeatherAgency.
Always greet the user politely and check if they want weather info.

## Behavior
When a message arrives:
1. Decide if the user is just greeting.
2. If they want weather information, pass the request to WeatherAgent.
3. Return a final response.

## Tools
No direct tools needed here. We rely on WeatherAgent to use WeatherTool.

## Volatile Memory
Will store any relevant user preferences (e.g., location).
```

### `WeatherAgent.agent`

```
# Agent Name: WeatherAgent
Title: Weather Assistant

## Static Memory
You are WeatherAgent. You specialize in providing weather data.

## Inheritance
No inheritance.

## Behavior
When requested for weather, use WeatherTool to fetch the data.
Format the result and return it to the caller.

## Tools
- WeatherTool

## Volatile Memory
Stores latest location requests for repeated usage.
```

### `WeatherTool.tool`

```
# Tool Name: WeatherTool
This tool calls an external weather API with the following details:
- Base URL: https://api.example-weather.com
- Endpoint: /current
- Required Query Param: location
- Returns JSON with fields: { "temp": number, "conditions": string }

## Implementation
Use 'fetch' to call the external API, parse the JSON, and return:
{
  "temp": <number>,
  "conditions": <string>
}

```

## 6.2 Example Compiled Agency Model (JSON)

When the **Compiler** processes these source files, it generates a single JSON structure capturing all Entities. Below is an **illustrative** (not fully exhaustive) example of what that might look like:

```json
{
  "name": "WeatherAgency",
  "type": "Agency",
  "staticMemory": [
    "We are WeatherAgency. We handle user greetings and weather information."
  ],
  "executiveAgent": "FrontDeskAgent",
  "agents": [
    {
      "name": "FrontDeskAgent",
      "title": "Front Desk",
      "inherits": null,
      "staticMemory": [
        "You are FrontDeskAgent, the main interface for the WeatherAgency.",
        "Always greet the user politely and check if they want weather info."
      ],
      "volatileMemory": [],
      "tools": [],
      "behavior": {
        "onMessage": [
          "Decide if the user is just greeting.",
          "If they want weather information, pass the request to WeatherAgent.",
          "Return a final response."
        ]
      }
    },
    {
      "name": "WeatherAgent",
      "title": "Weather Assistant",
      "inherits": null,
      "staticMemory": [
        "You are WeatherAgent. You specialize in providing weather data."
      ],
      "volatileMemory": [],
      "tools": ["WeatherTool"],
      "behavior": {
        "onMessage": [
          "When requested for weather, use WeatherTool to fetch the data.",
          "Format the result and return it to the caller."
        ]
      }
    }
  ],
  "tools": [
    {
      "name": "WeatherTool",
      "description": "Tool calls external weather API.",
      "implementation": {
        "type": "nodejs",
        "code": "/* Compiler-generated Node.js code with fetch logic */"
      },
      "interface": {
        "inputFormat": {
          "location": "string"
        },
        "outputFormat": {
          "temp": "number",
          "conditions": "string"
        }
      }
    }
  ],
  "subAgencies": [],
  "metadata": {
    "version": "1.0.0",
    "compiledAt": "2025-02-05T12:00:00Z",
    "compilerWarnings": []
  }
}
```

Notes:  
- `metadata.compilerWarnings` could list any ambiguities or issues the compiler found.  
- `volatileMemory` might be an empty array if no data has been persisted yet.  
- The `implementation.code` for `WeatherTool` is omitted here for brevity. In reality, it would contain Node.js code using `fetch` or another HTTP library.

---

# 7. Viability for Implementation

1. **Compiler**  
   - Leverages Node.js for reading/writing files.  
   - Uses an LLM-based parser or a custom parser to interpret each entity’s content.  
   - Generates valid JavaScript code for Tools and the overall JSON model for the entire Agency.

2. **Runtime**  
   - Loads the Agency Model (JSON).  
   - Dynamically loads the Node.js code for each Tool.  
   - Instantiates Agents with memory references.  
   - Sends messages from the user to the top-level Agency’s Executive Agent (e.g., `FrontDeskAgent` in the example).  
   - Maintains a **chain of thought** for each Agent, prompting an LLM with relevant memory (static/volatile).  
   - Manages concurrency, error handling, and memory persistence (via a pluggable NoSQL service).  
   - Exposes an HTTP REST API similar to OpenAI’s, allowing requests like:  
     ```
     POST /v1/agency/messages
     {
       "agency": "WeatherAgency",
       "message": "Hello, can you get me the weather in New York?"
     }
     ```  
   - Returns JSON responses to the client with the final answer or next steps.

3. **Memory Persistence**  
   - Each Agent’s volatile memory is stored in a structured NoSQL document.  
   - Summaries or “condensed memories” can be generated to keep context windows small for the LLM.  

4. **Integration and Extensibility**  
   - Written in ES6 modules (Node.js).  
   - Tools can integrate external APIs, additional local computation, or even orchestrate other microservices.  
   - Sub-Agencies can nest further, enabling large-scale hierarchical solutions.

---

# 8. Conclusion

This design document outlines a **human-language-driven** approach to building and running multi-agent AI systems. The **loose** and **readable** source format aims to lower the barrier for specifying agentic intelligence. Meanwhile, the **Compiler** enforces strict structure in a final JSON-based Agency Model, which the **Runtime** uses to orchestrate the system’s execution. 

**Key Takeaways**:

- **Entity Types** (Tool, Agent, Agency) provide clear separation of concerns (external services vs. internal LLM-driven logic vs. organizational structure).  
- **Memory** is a first-class concept, with both static and volatile sections.  
- **Hierarchical** approach (sub-Agencies, nested Agents) allows for scalable and modular AI design.  
- A **REST API** or CLI interface exposes the system to external callers, enabling easy integration into broader software environments.  

The example scenario demonstrates how Agents can coordinate to greet users and fetch weather data. The final JSON output (Agency Model) is structured enough to be interpreted reliably at runtime, ensuring consistent and maintainable solutions.