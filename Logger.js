
const fs = require('fs');

var logger = fs.createWriteStream(process.env.LOG_FILE_NAME, {
    flags: 'a' // 'a' means appending (old data will be preserved)
});

class Logger {
    log(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write(timeStamp + " / " + logString + "\r\n");
        }
    }

    logError(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write("[-]" + timeStamp + " / " + logString + "\r\n");
        }
    }

    logWarning(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write("[*]" + timeStamp + " / " + logString + "\r\n");
        }
    }

    logSuccess(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write("[+]" + timeStamp + " / " + logString + "\r\n");
        }
    }

    logInfo(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write("[!]" + timeStamp + " / " + logString + "\r\n");
        }
    }

    logTransaction(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write("[$]" + timeStamp + " / " + logString + "\r\n");
        }
    }

    logOrder(logString){
        if (process.env.LOGGING_ENABLED == "true") {
            var timeStamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
            logger.write("[|]" + timeStamp + " / " + logString + "\r\n");
        }
    }
}

module.exports = Logger;