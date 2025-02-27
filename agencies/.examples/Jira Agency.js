import Agency from "../runtime/agency.js";
import Agent from "../runtime/agent.js";
import Tool from "../runtime/tool.js";
import DelegateTool from "../runtime/delegateTool.js";
import fetch from 'node-fetch';

class JiraIssueSearchTool extends Tool {

    constructor() {
        super({
            name: "jiraIssueSearchTool",
            args: {
                "query": true, // required
                "jiraDomain": true, // required
                "apiToken": true, // required
                "email": true // required
            }
        });
    }

    description() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: "Search for Jira issues based on a query string. Requires 'query', 'jiraDomain', 'apiToken', and 'email' parameters for authentication and domain specifics.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The JQL query for searching issues."
                        },
                        jiraDomain: {
                            type: "string",
                            description: "The Jira domain to perform the search on."
                        },
                        apiToken: {
                            type: "string",
                            description: "API token for accessing Jira."
                        },
                        email: {
                            type: "string",
                            description: "Email associated with the Jira API token for authentication."
                        }
                    },
                    required: ["query", "jiraDomain", "apiToken", "email"]
                }
            }
        };
    }

    async execute(params) {
        const { query, jiraDomain, apiToken, email } = params;
        const searchUrl = `https://${jiraDomain}/rest/api/2/search?jql=${encodeURIComponent(query)}`;

        try {
            const response = await fetch(searchUrl, {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
                    "Accept": "application/json"
                }
            });
            if (!response.ok) {
                this.emit("problem", {
                    type: this.type,
                    name: this.name,
                    args: this.args,
                    message: `HTTP error! status: ${response.status}`
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const searchResults = await response.json();
            return searchResults.issues.map(issue => issue.key);

        } catch (error) {
            return `Error performing search: ${error.message}`;
        }
    }
}

class JiraIssueDetailsTool extends Tool {

    constructor() {
        super({
            name: "jiraIssueDetailsTool",
            args: {
                "issueKey": true, // required
                "jiraDomain": true, // required
                "apiToken": true, // required
                "email": true // required
            }
        });
    }

    description() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: "Retrieve detailed information about a specific Jira issue using 'issueKey', 'jiraDomain', 'apiToken', and 'email' for complete access.",
                parameters: {
                    type: "object",
                    properties: {
                        issueKey: {
                            type: "string",
                            description: "The key of the Jira issue to retrieve details for."
                        },
                        jiraDomain: {
                            type: "string",
                            description: "The Jira domain from which to retrieve the issue details."
                        },
                        apiToken: {
                            type: "string",
                            description: "API token for accessing Jira."
                        },
                        email: {
                            type: "string",
                            description: "Email associated with the Jira API token for authentication."
                        }
                    },
                    required: ["issueKey", "jiraDomain", "apiToken", "email"]
                }
            }
        };
    }

    async execute(params) {
        const { issueKey, jiraDomain, apiToken, email } = params;
        const detailUrl = `https://${jiraDomain}/rest/api/2/issue/${issueKey}`;

        try {
            const response = await fetch(detailUrl, {
                headers: {
                    "Authorization": `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
                    "Accept": "application/json"
                }
            });
            if (!response.ok) {
                this.emit("problem", {
                    type: this.type,
                    name: this.name,
                    args: this.args,
                    message: `HTTP error! status: ${response.status}`
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const issueDetails = await response.json();
            return issueDetails;

        } catch (error) {
            return `Error retrieving issue details: ${error.message}`;
        }
    }
}

const agent = new Agent({
    name: "jiraIssueAssistant",
    capabilities: "Expert in identifying and extracting Jira issue details, leveraging search and retrieval functionalities efficiently.",
    instructions: "You are the Jira Issue Assistant. Use jiraIssueSearchTool to find issues and retrieve their details with the jiraIssueDetailsTool. Remember 'jiraDomain', 'apiToken', and 'email' from previous interactions for seamless investigations.",
    tools: [new JiraIssueSearchTool(), new JiraIssueDetailsTool()]
});

export default agent;