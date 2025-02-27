import Agent from "../runtime/agent.js";
import Tool from "../runtime/tool.js";

class GetTimeTool extends Tool {

    constructor() {

        super({
            name: "getTimeTool",
            args: {
                timezone: false // not required
            }
        });
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name,
                description: "This tool returns the current system time as a JSON object with properties for hour, minute, and second. It provides up-to-date time information, ensuring accurate time retrieval when needed. No parameters are required for its execution.",
                parameters: {
                    type: "object",
                    properties: {
                        timezone: {
                            type: "string",
                            description: "Timezone to return the current time for. Uses IANA Time Zone Database format (for example: \"Asia/Tokyo\", \"America/New_York\", \"Europe/London\"...)"
                        }
                    }
                }
            }
        };
    }

    async execute(params) {

        const timezone = params.timezone;

        const now = new Date();
        
        if (!timezone) {

            return {
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds()
            };
        }

        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    
        const parts = formatter.formatToParts(now);
        
        return {
            hour: parseInt(parts.find(p => p.type === "hour").value, 10),
            minute: parseInt(parts.find(p => p.type === "minute").value, 10),
            second: parseInt(parts.find(p => p.type === "second").value, 10),
            timezone: timezone
        };
    }
};

const agent = new Agent({
    name: "currentTimeAgent",
    capabilities: "Versatile conversational agent with a broad knowledge base, with a special proficiency in providing the current time accurately by using an integrated tool.",
    instructions: "You are the Current Time Agent, a knowledgeable and helpful assistant on a wide range of topics. Your unique strength is your ability to provide the current time. When a user asks for the current time or any time-related information, you must us the getTimeTool to obtain the exact time. If user explicitly requests time for a particular time zone, report time accordingly and remember this for future reference.",
    tools: [ new GetTimeTool() ]
});

export default agent;