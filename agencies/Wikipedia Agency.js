import Agency from "../runtime/agency.js";
import Agent from "../runtime/agent.js";
import Tool from "../runtime/tool.js";
import DelegateTool from "../runtime/delegateTool.js";
import fetch from 'node-fetch';

class WikipediaSearchTool extends Tool {

    constructor() {

        super({
            name: "wikipediaSearchTool",
            args: {
                "searchTerm": true, // required
                "resultsLimit": false // not required
            }
        });
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name,
                description: "This tool queries Wikipedia using the MediaWiki API to locate the most relevant page for a given search term. It returns a concise summary (up to 200 words) of that page. If necessary, this tool can be called repeatedly with refined parameters to ensure that all relevant details are captured. It requires a 'searchTerm' parameter and accepts an optional 'resultsLimit' to adjust the number of search results considered.",
                parameters: {
                    type: "object",
                    properties: {
                        searchTerm: {
                            type: "string",
                            description: "The term to search on Wikipedia."
                        }
                    },
                    required: [
                        "searchTerm"
                    ]
                }
            }
        };
    }

    async execute(params) {

        const term = params.searchTerm;
        const limit = params.resultsLimit??10;
        
        async function fetchWikiContent(searchTerm, resultsLimit) {

            try {

                const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=${resultsLimit}&format=json`;
                
                var response = await fetch(searchUrl);
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

                if (!searchResults.query.search.length) {

                    return `No results found for "${searchTerm}"`;
                }
                
                const bestMatchTitle = searchResults.query.search[0].title;
                const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestMatchTitle)}`;
                
                response = await fetch(pageUrl);
                if (!response.ok) {
            
                    this.emit("problem", {
                        type: this.type,
                        name: this.name,
                        args: this.args,
                        message: `HTTP error! status: ${response.status}`
                    });
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            
                const pageContent = await response.json();

                return pageContent.extract
                    || `No summary available for "${bestMatchTitle}"`;
            }
            catch (error) {

                return `Error fetching Wikipedia content: ${error.message}`;
            }
        }

        const result = await (fetchWikiContent.bind(this)(params.searchTerm, params.resultsLimit));

        return result;
    }
};

const agency = new Agency({
    name: "wikipediaAgency",
    capabilities: "Combines direct conversational abilities with specialized Wikipedia lookup functions. Capable of both engaging users directly and delegating in-depth tasks to the Wikipedia Agent.",
    instructions: "You are the Wikipedia Agency. Your role is to interpret user queries and respond appropriately, delegating tasks to the Wikipedia Agent as needed. Instruct the agent to re-use the wikipediaSearchTool as many times as needed to refine and fully satisfy the query. Ensure that the final response is complete, accurate, and directly addresses the user's request.",
    tools: [
        new DelegateTool(
            new Agent({
                name: "wikipediaAgent",
                capabilities: "Specialized in performing Wikipedia lookups and summarization. Expert at retrieving clear, concise, and up-to-date summaries by dynamically using the available tool.",
                instructions: "You are the Wikipedia Agent. Your task is to use the wikipediaSearchTool to identify the best matching page on Wikipedia for a given topic and provide a clear, factually correct summary (up to 200 words). If the initial response does not completely satisfy the query—whether due to ambiguity or missing details—do not hesitate to re-invoke the tool with additional or refined queries until the answer fully addresses the user's needs.",
                tools: [ new WikipediaSearchTool() ]
            })
        )
    ]
});

export default agency;