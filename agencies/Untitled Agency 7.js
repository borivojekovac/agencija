import Agency from "../runtime/agency.js";
import Agent from "../runtime/agent.js";
import Tool from "../runtime/tool.js";
import DelegateTool from "../runtime/delegateTool.js";
import fetch from 'node-fetch';
import https from 'https';

class GoogleSearchTool extends Tool {

    constructor() {
        super({
            name: "googleSearchTool",
            args: {
                "query": true, // required
                "apiKey": true, // required
                "searchEngineId": true // required
            }
        });
    }

    description() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: "Performs a Google search and returns top URLs matching the given query. Requires 'query', 'apiKey', and 'searchEngineId' parameters, optionally can use 'top' parameter to limit number of results to less than 10.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search term or topic to look for."
                        },
                        top: {
                            type: "string",
                            description: "Maximum number of results. Must be between 1 and 10."
                        },
                        apiKey: {
                            type: "string",
                            description: "Google API Key for authentication."
                        },
                        searchEngineId: {
                            type: "string",
                            description: "Google Search Engine ID for scoping the search."
                        }
                    },
                    required: ["query", "apiKey", "searchEngineId"]
                }
            }
        };
    }

    async execute(params) {
        const { query, apiKey, searchEngineId } = params;
        var top = 10; // maximum allowed results when doing www.googleapis.com/customsearch
        if (params.top) {
            if (params.top > 0 && params.top < 10) {
                top = params.top;
            }
        }
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}&num=${top}`;

        try {
            const response = await fetch(searchUrl);
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
            if (!searchResults.items || !Array.isArray(searchResults.items)) {
                return [];
            }
            const urls = [];
            for (const item of searchResults.items) {
                urls.push(item.link);
            }
            
            return urls;

        } catch (error) {
            return `Error performing search: ${error.message}`;
        }
    }
}

class WebPageRetrievalTool extends Tool {

    constructor() {
        super({
            name: "webPageRetrievalTool",
            args: {
                "url": true // required
            }
        });
    }

    description() {
        return {
            type: "function",
            function: {
                name: this.name,
                description: "Retrieves the plain text content of a web page given a URL, handling HTML-to-text conversion.",
                parameters: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The URL of the web page to retrieve content from."
                        }
                    },
                    required: ["url"]
                }
            }
        };
    }

    decodeHTMLEntities(text) {
        return text.replace(/&#(\d+);/g, (match, dec) => {
            return String.fromCharCode(dec);
        }).replace(/&nbsp;/gi, ' ')
          .replace(/&quot;/gi, '"')
          .replace(/&apos;/gi, "'")
          .replace(/&amp;/gi, '&')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>');
    }

    async execute(params) {
        const url = new URL(params.url);

        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    let cleanedData = data.replace(/<script[\s\S]*?<\/script>/gi, '')
                                          .replace(/<style[\s\S]*?<\/style>/gi, '');
                    cleanedData = cleanedData.replace(/<br\s*\/?>/gi, '\n')
                                             .replace(/<\/p>/gi, '\n');
                    cleanedData = cleanedData.replace(/<[^>]+>/g, ' ');
                    const decodedText = this.decodeHTMLEntities(cleanedData);
                    const plainText = decodedText.replace(/[\r\n]+/g, ' ')
                                                 .replace(/\s+/g, ' ')
                                                 .trim();
                    resolve(plainText || "");
                });
            }).on('error', (err) => {
                this.emit("problem", {
                    type: this.type,
                    name: this.name,
                    args: this.args,
                    message: `Error fetching content from URL: ${err.message}`
                });
                reject(err);
            });
        });
    }
}

const agency = new Agency({
    name: "internetResearchAgency",
    capabilities: "Conducts comprehensive Internet research providing detailed information and summaries for found articles.",
    instructions: "Provide necessary labor division among your Agents: Planner, Searcher and Summarizer. Ensuring Planner clearly lays out steps to follow, Searcher executes authorized tools for finding Internet articles, and Summarizer wraps up the report with brief conclusions of the articles.",
    tools: [
        new DelegateTool(
            new Agent({
                name: "planner",
                capabilities: "Implements detailed planning for the research steps to follow.",
                instructions: "Develop a detailed step-by-step plan for processing the search request using available tools and their properties.",
                tools: []
            })
        ),
        new DelegateTool(
            new Agent({
                name: "searcher",
                capabilities: "Conducts searching of relevant Internet articles.",
                instructions: "Sequentially use googleSearchTool to obtain a set of valid URLs matching user's request.",
                tools: [new GoogleSearchTool()]
            })
        ),
        new DelegateTool(
            new Agent({
                name: "summariser",
                capabilities: "Provides a summary of identified articles.",
                instructions: "Use webPageRetrievalTool to retrieve plain text from the found URLs and generate a summary.",
                tools: [new WebPageRetrievalTool()]
            })
        )
    ]
});

export default agency;