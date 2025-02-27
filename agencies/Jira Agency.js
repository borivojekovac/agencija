import Agency from "../runtime/agency.js";
import Agent from "../runtime/agent.js";
import Tool from "../runtime/tool.js";
import DelegateTool from "../runtime/delegateTool.js";
import https from 'https';

class JiraFindIssuesTool extends Tool {
    constructor() {
        super({
            name: "jiraFindIssuesTool",
            args: {
                "jqlQuery": true, // required
                "jiraBaseUrl": true, // required
                "username": true, // required
                "apiToken": true // required
            }
        });
    }

    description() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: "Finds Jira issues using a JQL query and returns a list of issue keys.",
                parameters: {
                    type: "object",
                    properties: {
                        jqlQuery: { type: "string", description: "The Jira Query Language (JQL) string." },
                        jiraBaseUrl: { type: "string", description: "The base URL for Jira instance, e.g., 'https://yourjira.atlassian.net'." },
                        username: { type: "string", description: "Jira account username." },
                        apiToken: { type: "string", description: "API token for Jira account." },
                    },
                    required: ["jqlQuery", "jiraBaseUrl", "username", "apiToken"]
                }
            }
        };
    }

    async execute(params) {
        const { jqlQuery, jiraBaseUrl, username, apiToken } = params;
        const url = `${jiraBaseUrl}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}`;

        return new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${username}:${apiToken}`).toString('base64')}`,
                    'Accept': 'application/json'
                }
            }, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        const issues = JSON.parse(data);
                        resolve(issues.issues.map(issue => issue.key));
                    } else {
                        reject(new Error(`Error fetching Jira issues: ${response.statusCode}: ${data}`));
                    }
                });
            });

            request.on('error', (err) => reject(new Error(`Error with request: ${err.message}`)));
        });
    }
}

class JiraGetIssueDetailsTool extends Tool {
    constructor() {
        super({
            name: "jiraGetIssueDetailsTool",
            args: {
                "issueKey": true, // required
                "jiraBaseUrl": true, // required
                "username": true, // required
                "apiToken": true // required
            }
        });
    }

    description() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: "Retrieves details of a specified Jira issue.",
                parameters: {
                    type: "object",
                    properties: {
                        issueKey: { type: "string", description: "The key of the Jira issue, e.g., 'PROJECT-123'." },
                        jiraBaseUrl: { type: "string", description: "The base URL for Jira instance, e.g., 'https://yourjira.atlassian.net'." },
                        username: { type: "string", description: "Jira account username." },
                        apiToken: { type: "string", description: "API token for Jira account." },
                    },
                    required: ["issueKey", "jiraBaseUrl", "username", "apiToken"]
                }
            }
        };
    }

    async execute(params) {
        const { issueKey, jiraBaseUrl, username, apiToken } = params;
        const url = `${jiraBaseUrl}/rest/api/3/issue/${issueKey}`;

        return new Promise((resolve, reject) => {
            const request = https.get(url, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${username}:${apiToken}`).toString('base64')}`,
                    'Accept': 'application/json'
                }
            }, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        const issueDetails = JSON.parse(data);
                        resolve(issueDetails);
                    } else {
                        reject(new Error(`Error fetching issue details: ${response.statusCode}: ${data}`));
                    }
                });
            });

            request.on('error', (err) => reject(new Error(`Error with request: ${err.message}`)));
        });
    }
}

const agency = new Agency({
    name: "jiraIssueResearchAgency",
    capabilities: "Specializes in identifying and retrieving Jira issue details, efficiently finding and extracting issue data.",
    instructions: "You are the Jira Issue Research Agency. Your role is to locate Jira issues using the findIssuesAgent and then gather detailed information using the getIssueDetailsAgent. Ensure all responses are comprehensive and accurate.",
    tools: [
        new DelegateTool(
            new Agent({
                name: "findIssuesAgent",
                capabilities: "Locates Jira issues based on JQL queries.",
                instructions: "Use the jiraFindIssuesTool to identify relevant issues and return their issue keys.",
                tools: [new JiraFindIssuesTool()]
            })
        ),
        new DelegateTool(
            new Agent({
                name: "getIssueDetailsAgent",
                capabilities: "Fetches and summarizes details for specified Jira issues.",
                instructions: "Use the jiraGetIssueDetailsTool to fetch comprehensive details of a given issue key.",
                tools: [new JiraGetIssueDetailsTool()]
            })
        )
    ]
});

export default agency;