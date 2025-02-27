import config from "config";
import winston from 'winston';

const log = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: config.log.folder })
    ]
});

export default log;