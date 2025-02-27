import Agency from "../runtime/agency.js";
import Agent from "../runtime/agent.js";
import Tool from "../runtime/tool.js";
import DelegateTool from "../runtime/delegateTool.js";
import fetch from 'node-fetch';

class GeolocationTool extends Tool {

    constructor() {

        super({
            name: "geolocationTool",
            args: {
                "locationName": true // required
            }
        });
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name,
                description: "This tool retrieves the latitude and longitude for a given location name using the GeoNames API. Requires 'locationName' as a parameter.",
                parameters: {
                    type: "object",
                    properties: {
                        locationName: {
                            type: "string",
                            description: "The name of the location for geocoding."
                        }
                    },
                    required: ["locationName"]
                }
            }
        };
    }

    async execute(params) {

        const username = "demo"; // GeoNames demo username, replace with real in production
        const locationName = encodeURIComponent(params.locationName);
        const geoNamesUrl = `http://api.geonames.org/searchJSON?q=${locationName}&maxRows=1&username=${username}`;

        try {

            const response = await fetch(geoNamesUrl);
            if (!response.ok) {
        
                this.emit("problem", {
                    type: this.type,
                    name: this.name,
                    args: this.args,
                    message: `HTTP error! status: ${response.status}`
                });
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        
            const geoData = await response.json();
            if (geoData.geonames && geoData.geonames.length > 0) {

                const { lat, lng } = geoData.geonames[0];
                return { latitude: lat, longitude: lng };
            }
            
            throw new Error("No geolocation data found.");
            
        } catch (error) {

            this.emit("problem", {
                type: this.type,
                name: this.name,
                args: this.args,
                message: `Error in geolocation: ${error.message}`
            });

            // Fallback to internal knowledge
            const defaultCoords = { latitude: "0.0000", longitude: "0.0000" };
            return defaultCoords;
        }
    }
};

class CurrentWeatherTool extends Tool {

    constructor() {

        super({
            name: "currentWeatherTool",
            args: {
                "latitude": true, // required
                "longitude": true // required
            }
        });
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name,
                description: "This tool retrieves the current weather information for the specified latitude and longitude using the YR.no API.",
                parameters: {
                    type: "object",
                    properties: {
                        latitude: {
                            type: "string",
                            description: "The latitude of the location."
                        },
                        longitude: {
                            type: "string",
                            description: "The longitude of the location."
                        }
                    },
                    required: ["latitude", "longitude"]
                }
            }
        };
    }

    async execute(params) {

        const { latitude, longitude } = params;
        const weatherUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

        try {

            const response = await fetch(weatherUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
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

            const weatherData = await response.json();
            const timeseries = weatherData.properties.timeseries || [];
            if (timeseries.length) {

                return timeseries[0].data.instant.details;
            }
            
            throw new Error("No current weather data found.");
            
        } catch (error) {

            return `Error fetching current weather: ${error.message}`;
        }
    }
};

class WeatherForecastTool extends Tool {

    constructor() {

        super({
            name: "weatherForecastTool",
            args: {
                "latitude": true, // required
                "longitude": true // required
            }
        });
    }

    description() {

        return {
            type: "function",
            function: {
                name: this.name,
                description: "This tool retrieves the weather forecast for the specified latitude and longitude using the YR.no API.",
                parameters: {
                    type: "object",
                    properties: {
                        latitude: {
                            type: "string",
                            description: "The latitude of the location."
                        },
                        longitude: {
                            type: "string",
                            description: "The longitude of the location."
                        }
                    },
                    required: ["latitude", "longitude"]
                }
            }
        };
    }

    async execute(params) {

        const { latitude, longitude } = params;
        const forecastUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

        try {

            const response = await fetch(forecastUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
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

            const forecastData = await response.json();
            const forecasts = forecastData.properties.timeseries || [];
            return forecasts.slice(0, 5).map(forecast => ({
                time: forecast.time,
                details: forecast.data.instant.details
            }));

        } catch (error) {

            return `Error fetching weather forecast: ${error.message}`;
        }
    }
};

const weatherForecastAgency = new Agency({
    name: "weatherForecastAgency",
    capabilities: "Delivers current and forecasted weather data efficiently using accurate geolocation.",
    instructions: "You are the Weather Forecast Agency. Use geolocationAgent to find latitude and longitude for location names. Use currentWeatherAgent and weatherForecastAgent with at-the-minute weather updates and forecasts using YR.no data. Ensure accuracy and comprehensiveness in reports.",
    tools: [
        new DelegateTool(
            new Agent({
                name: "geolocationAgent",
                capabilities: "Provides geolocation for any named location. Uses internal fallback if external call fails.",
                instructions: "You are the Geolocation Agent. Map location names to latitude and longitude using the geolocationTool, fallback to default coordinates if the API call fails.",
                tools: [new GeolocationTool()]
            })
        ),
        new DelegateTool(
            new Agent({
                name: "currentWeatherAgent",
                capabilities: "Fetches current weather based on given geolocation.",
                instructions: "You are the Current Weather Agent. Use currentWeatherTool to obtain current, precise weather conditions by latitude and longitude.",
                tools: [new CurrentWeatherTool()]
            })
        ),
        new DelegateTool(
            new Agent({
                name: "weatherForecastAgent",
                capabilities: "Gives detailed weather forecasts based on location coordinates.",
                instructions: "You are the Weather Forecast Agent. Retrieve 5-step detailed weather forecasts using weatherForecastTool, specifying latitude and longitude.",
                tools: [new WeatherForecastTool()]
            })
        )
    ]
});

export default weatherForecastAgency;