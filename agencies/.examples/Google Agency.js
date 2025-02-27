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
                description: "Conducts a Google search based on the provided query and returns URLs of relevant articles.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The topic or subject to search for on the Internet."
                        },
                        apiKey: {
                            type: "string",
                            description: "Google API Key used for authentication."
                        },
                        searchEngineId: {
                            type: "string",
                            description: "Google Search Engine ID used for scoping the search."
                        }
                    },
                    required: ["query", "apiKey", "searchEngineId"]
                }
            }
        };
    }

    async execute(params) {
        const { query, apiKey, searchEngineId } = params;
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}`;

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
            const urls = searchResults.items.map(item => item.link);
            
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
                description: "Retrieves and cleans the plain text content of a web page from the specified URL, stripping away HTML tags and metadata.",
                parameters: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The URL of the web page to fetch content from."
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
    name: "internetArticleAgency",
    capabilities: "Specializes in researching and summarizing online articles related to a specific subject, utilizing necessary tools to deliver accurate summaries.",
    instructions: "You are an Internet Article Agency expert in finding and summarizing articles. Use googleSearchAgent to conduct focused searches, and urlSummarizerAgent to retrieve and summarize content. Ensure clarity and relevance in the information provided.",
    tools: [
        new DelegateTool(
            new Agent({
                name: "googleSearchAgent",
                capabilities: "Conducts focused searches on the internet using Google Search API.",
                instructions: "You are the Google Search Agent. Use the googleSearchTool to find relevant articles based on user queries.",
                tools: [new GoogleSearchTool()]
            })
        ),
        new DelegateTool(
            new Agent({
                name: "urlSummarizerAgent",
                capabilities: "Retrieves and summarizes the plain text content from URLs into clear and concise information.",
                instructions: "You are the URL Summarizer Agent. Use the webPageRetrievalTool to fetch content and process it into a coherent summary.",
                tools: [new WebPageRetrievalTool()]
            })
        )
    ]
});

export default agency;