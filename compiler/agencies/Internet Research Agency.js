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
                "site": true,  // required
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
                description: "Performs a Google search restricted to a domain and returns top URLs matching the given query. Requires 'query', 'site', 'apiKey', and 'searchEngineId' parameters, optionally can use 'top' parameter to limit number of results to less than 10.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search term or topic to look for."
                        },
                        site: {
                            type: "string",
                            description: "The domain to restrict the search to."
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
                    required: ["query", "site", "apiKey", "searchEngineId"]
                }
            }
        };
    }

    async execute(params) {
        const { query, site, apiKey, searchEngineId } = params;
        var top = 10; // maximum allowed results when doing www.googleapis.com/customsearch
        if (params.top) {
            if (params.top > 0 && params.top < 10) {
                top = params.top;
            }
        }
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${query}+site:${site}&num=${top}`;

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
    capabilities: "Conducts detailed internet research using reputable sources, substantiating findings with validated links.",
    instructions: "You are the Internet Research Agency. Your duty is to carry out comprehensive research to reinforce information reliability. Utilize reputableSourceChooserAssistant for choosing sources and internetSearchAgent for accessing information from the internet, while ensuring all sourced materials are linked. Emphasize accuracy and thoroughness.",
    tools: [
        new DelegateTool(
            new Agent({
                name: "reputableSourceChooserAssistant",
                capabilities: "Identifies suitable reputable sources from a specified list for query topics.",
                instructions: `Determine top 3 applicable domains for the user's query based on the reputable sources table. Respond with the list of these domains without executing any tools.
|Domain                      |Reputable source for queries on                           |
|----------------------------|----------------------------------------------------------|
|www.wikipedia.org           |General knowledge, history, science                       |
|www.gutenberg.org           |Literature, public domain books                           |
|arxiv.org                   |Scientific preprints, research, technical studies         |
|openlibrary.org             |Books, literature, historical texts                       |
|archive.org                 |Historical documents, digital archives, media             |
|www.nasa.gov                |Space, astronomy, science research                        |
|www.loc.gov                 |History, cultural heritage, archival materials            |
|www.weather.gov             |Weather forecasts, meteorological data                    |
|www.noaa.gov                |Atmospheric and oceanic data, climate research            |
|www.cdc.gov                 |Public health, disease prevention, medical guidance       |
|www.epa.gov                 |Environmental data, regulation, sustainability            |
|www.usda.gov                |Agriculture, nutrition, food safety                       |
|www.fda.gov                 |Food and drug safety, public health information           |
|www.usa.gov                 |U.S. government services and general official information |
|www.data.gov                |U.S. government open data on a range of topics            |
|www.nationalarchives.gov.uk |Historical documents, government records (UK)             |
|www.bls.gov                 |Labor statistics, economic data                           |
|www.fcc.gov                 |Communications, broadcasting, regulatory information      |
|www.nsf.gov                 |Science funding, research, technology innovation          |
|www.census.gov              |Demographic and economic data                             |`,
                tools: []
            })
        ),
        new DelegateTool(
            new Agent({
                name: "internetSearchAgent",
                capabilities: "Executes domain-restricted searches and retrieves textual overviews of prominent results.",
                instructions: "You are the Internet Search Agent. Perform searches using googleSearchTool and retrieve details via webPageRetrievalTool. Provide clear, informative summaries of top results, referencing and linking to all sources.",
                tools: [new GoogleSearchTool(), new WebPageRetrievalTool()]
            })
        )
    ]
});

export default agency;