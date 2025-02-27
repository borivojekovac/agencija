
# Agencija

This project is a simple Node.js framework for building and executing Agentic AI solutions using OpenAI's assistants and threads APIs, with special support for compiling human-readable agency specifications into executable Node.js modules.

## Installation
Instructions on how to set up the project locally.
```bash
# Clone the repository
git  clone  https://github.com/borivojekovac/agencija.git

# Navigate into the project directory
cd  agencija

# Install dependencies
npm  install
```

## Key Features
Key features include:

-  **Agentic Framework**: A simple foundation for building and executing AI agents, written in Node.js. Offers a flexible and extensible architecture for building AI agents, and event-based obsevability.
-  **Compilation**: A compiler that automatically converts human-readable agency specifications into executable Node.js modules, and fixes compilation bugs automatically.
-  **Command line interface**: A command-line interfaces for both agentic AI runtime and compiler.
-  **API**: An API providing programmatic access to both runtime and compiler functionalities. Also features passing server-side events to clients using Socket.io, enabling real-time observability on the client side.
-  **Web UI**: A user-friendly browser interface that enables interaction with the runtime and compiler functionalities.

## Agentic Framework
The /runtime folder contains a robust foundation for building and executing AI agents. The framework implements an event-driven architecture with persistent memory, tool execution capabilities, and agent delegation patterns.

### Provider Class (`./runtime/llm/provider.js`)
Abstract base provider for LLM services:
- Core interface for assistant and thread management
- Standardized methods for message handling
- Default provider configuration support
- Event-driven observability

### OpenAiProvider Class (`./runtime/llm/openAiProvider.js`)
Concrete implementation of Provider for OpenAI services:
- Manages OpenAI assistants and threads lifecycle
- Implements response processing
- Handles tools invocation

### Entity Class (`./runtime/entity.js`)

Base class providing fundamental entity functionality:
- Common properties like name and type
- Observability using EventEmitter
- Foundation for Tools, Agents and Agencies

### Agent Class (`./runtime/agent.js`)

Represents an individual AI agent with capabilities:
- Tool management and execution
- Memory access and persistence
- Message handling and response generation
- LLM integration and prompt management
- Observability using EventEmitter

### Agency Class (`./runtime/agency.js`)
Manages collections of agents and their interactions:
- Functional equivalence with Agent class
- Distinction from Agent class for clarity

### Memory Class (`./runtime/memory.js`)
The Memory system provides persistent storage and real-time state management:
- Event-driven memory updates through file watching
- Shared memory access across agency agents
- Markdown-formatted memory instructions for LLM context
- Automatic memory file creation and initialization
- Memory state persistence between sessions

### Tool Class (`./runtime/tool.js`)
Base class for implementing agent capabilities with built-in execution controls:
- Parameter validation and argument mapping
- Event emission for execution monitoring
- Standardized tool initialization and ownership
- Required arguments specification
- Execution wrapper pattern through use() method

### DelegateTool Class (`./runtime/delegateTool.js`)
Specialized tool for agent task delegation and execution:
- Structured message formatting for agent communication
- Support for both simple and detailed task instructions
- Direct agent response handling

### MemoryTool Class (`./runtime/memoryTool.js`)
Specialized tool for storing and retrieving shared agency memory:
- Provides shared memory access across all agents in an agency
- Supports storing memories with named associations
- Enables forgetting specific memories by association
- Automatically included in every agent's toolset

## Compiler System
The compiler system consists of two main components that work together to transform human-readable agency specifications into executable Node.js code:

### Console Interface (`./compiler/console.js`)
Key features include:
- Command-line interface for agency compilation
- Agency file name parameter handling
- Interactive prompt for agency selection
- Integration with the main compiler

Usage:

```bash
node  compiler/console.js  "agency=Current Time Agent"
```

### Compiler Core (`./compiler/compiler.js`)
Key features include:
- Converts .txt agency specifications into executable .js modules
- Uses GPT-4 through OpenAI provider for code generation
- Implements automatic bug detection and fixing
- Provides compilation event notifications
- Supports forced recompilation

#### Compilation Process

1.  **Initialization**
- Sets up OpenAI provider
- Validates source and target files
- Emits compilation start events

2.  **Code Generation**
- Uses a "Developer Agent" with specialized instructions
- Transforms human specifications into JavaScript code
- Performs initial code generation

3.  **Validation & Debug**
- Tests generated code through temporary module loading
- Implements 3 retry attempts for error correction
- Uses a "Debugger Agent" to fix detected issues
- Provides detailed error context to the debugger

4.  **Output**
- Writes validated code to target .js file
- Emits compilation completion events
- Returns output filename for further use

## Console Interface (`./console.js`)
The console.js file serves as the command-line interface for running and interacting with agencies. It provides a user-friendly interface to load agencies, compile them, and execute them.

### Event Handling & Logging
Listens to and logs various system events:
- Entity creation and initialization
- Agent messages and responses
- Tool execution and results
- Compilation events
- Problem/error reporting

### Agency Loading
- Accepts agency name via command line parameter: "agency=Agency Name"
- Supports interactive agency selection if not specified via command line
- Validates agency source files in the ./agencies directory
- Automatically appends .txt extension when needed

### Compilation & Initialization
- Uses the Compiler system to transform agency plain-text specifications into executable JS, if one is not already present
- Sets up OpenAI provider and a default LLM
- Loads the compiled agency module dynamically
- Initializes the agency with proper configuration

### Interactive Console
- Provides a REPL-style interface for sending messages to the agency
- Displays agency responses with proper formatting
- Supports 'quit' command to exit gracefully
- Shows execution status and tool usage

Usage Example:

```bash
node  console.js  "agency=Current Time Agent"
```

## Server
Key Integration Points:

- Server class orchestrates all components
- Components follow consistent initialization pattern
- Event-driven architecture throughout
- Clean separation of concerns between static serving (Web), API handling, and application logic

This modular architecture allows for easy maintenance and scalability while keeping concerns separated between different components.

### Console Component (`./server/console.js`)
- main() entry point for server execution
- Handles server lifecycle management
- Implements command-line interface
- Listens for events: server-started, server-stopped, request, response, problem
- Provides graceful shutdown with 'quit' command

### Server Class (`./server/server.js`)
- Sets up both HTTP and HTTPS servers using Express
- Manages SSL certificates for HTTPS
- Coordinates initialization of Web, API, and App components
- Handles global error cases (unhandled rejections/exceptions)
- Provides lifecycle methods: init(), run(), stop()
- Default ports: HTTP 8000, HTTPS 8443

### Web Class (`./server/web.js`)
- Handles static file serving
- Serves content from '../web' directory
- Provides markdown support through '/markdown' endpoint
- Simple initialization through init() method

### App Class (`./server/app.js`)
- Manages application logic
- Handles Socket.IO connections, and implements real-time communication
- Tracks client connections/disconnections

## API

Base URL:  `/api/v1`

### Agencies Endpoints (`./server/api/agencies.js`)

#### GET Endpoints

-   `/agency`
    
    -   Returns all agencies with their definitions and compiled code
    -   Response: Object containing agency names as keys with their definition and compiled code
-   `/agency/:id`
    
    -   Returns a specific agency by name
    -   Response: Agency object with name, definition, and compiled code
-   `/agency/:id/memory`
    
    -   Returns the memory state of a specific agency
    -   Response: Memory object for the specified agency

#### POST Endpoints

-   `/agency`
    
    -   Creates a new agency
    -   Body:  `{ name: string, definition?: string, compiled?: string }`
    -   Response: Created agency object
-   `/agency/:id/compile`
    
    -   Compiles an agency's definition
    -   Body:  `{ definition: string }`
    -   Response: Updated agency object
-   `/agency/:id/rename`
    
    -   Renames an existing agency
    -   Body:  `{ name: string }`
    -   Response: Updated agency object
-   `/agency/:id/definition`
    
    -   Updates an agency's definition
    -   Body:  `{ definition: string }`
    -   Response: Updated agency object
-   `/agency/:id/compiled`
    
    -   Updates an agency's compiled code
    -   Body:  `{ compiled: string }`
    -   Response: Updated agency object
-   `/agency/:id/memory`
    
    -   Updates an agency's memory state
    -   Body:  `{ memory: string }`
    -   Response: Updated memory object

#### DELETE Endpoints

-   `/agency/:id`
    
    -   Deletes an agency and its associated files
    -   Response: Success message
-   `/agency/:id/memory`
    
    -   Clears an agency's memory state
    -   Response: Empty memory object

### Chat Endpoints (`./server/api/chat.js`)

#### POST Endpoints

-   `/chat/new/:agency`
    
    -   Starts a new chat session with specified agency
    -   Headers required:  `x-socket-id`
    -   Response:  `{ id: string }`  (assistant ID)
-   `/chat/:id`
    
    -   Sends a message to an existing chat session
    -   Headers required:  `x-socket-id`
    -   Body:  `{ message: string }`
    -   Response:  `{ response: string }`

### WebSocket Events (`./server/api/api.js`)

The API includes WebSocket support with the following events:

#### Entity Events

-   `created`
-   `initialised`
-   `message`
-   `response`
-   `execute`
-   `result`
-   `problem`

#### Compiler Events

-   `compiling`
-   `bugfixing`
-   `compiled`

#### Memory Events

-   `memoryupdated`

#### Provider Events

-   `initialised`
-   `assistantcreated`
-   `threadcreated`
-   `runcreated`
-   `runcompleted`
-   `problem`

#### Domain Events

-   `cleanup`
-   `problem`
-   `delete`
-   `create`
-   `update`

All endpoints follow RESTful conventions and return appropriate HTTP status codes for success and error cases.

## Web UI

Web UI architecture provides a modular, maintainable and feature-rich web interface for the Agencija framework.

Key features include:
-   Real-time updates via Socket.IO
-   Markdown rendering support
-   Code editing capabilities
-   Interactive agency management
-   Live chat functionality
-   System event logging
-   Memory state visualization

### Core Components

#### App Class (`./web/app.js`)

-   Central application controller
-   Manages tab initialization and switching
-   Handles global UI element references
-   Maintains chat session state
-   Provides error logging functionality

#### Api Class (`./web/api.js`)

-   Handles all REST API communications
-   Manages Socket.IO real-time connections
-   Implements loading spinner functionality
-   Supports GET, POST, PUT, DELETE, PATCH operations
-   Adds socket ID to all requests

#### Tab System 

Base Tab Class (`./web/app.js`):

-   Provides common tab functionality
-   Handles event binding/unbinding
-   Shares access to UI, API and callbacks

Specialized Tabs:

1.  AgenciesTab (`./web/agenciesTab.js`)
    
    -   Manages agency list
    -   Handles agency CRUD operations
    -   Controls agency selection
2.  ChatTab (`./web/chatTab.js`)
    
    -   Manages chat sessions
    -   Handles message sending/receiving
    -   Renders markdown messages
3.  DefinitionTab (`./web/definitionTab.js`)
    
    -   Displays/edits agency specifications
    -   Handles compilation requests
    -   Updates agency definitions
4.  CompiledTab (`./web/compiledTab.js`)
    
    -   Shows compiled agency code
    -   Allows code modifications
    -   Handles code updates
5.  MemoryTab (`./web/memoryTab.js`)
    
    -   Displays agency memory state
    -   Supports memory updates/clearing
    -   Real-time memory sync
6.  LogTab (`./web/logTab.js`)
    
    -   Shows server-side events
    -   Displays system messages
    -   Handles multiple event types

### UI Layout (`./web/index.html`)

-   Responsive single-page design
-   Tab-based navigation
-   Content areas for each tab
-   Command areas for actions
-   Loading spinner indicator