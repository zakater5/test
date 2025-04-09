
require('dotenv').config(); // Load environment variables
const rateLimit_req = process.env.RATE_LIMIT_REQUESTS;
const rateLimit_time = process.env.RATE_LIMIT_TIME;

// Libraries //
const LoggerClass = require('./Logger');
const { parse } = require('path');
const favicon = require('serve-favicon'); //for website favicon (the tab icon)
const { Console } = require('console');
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const sessions = require('express-session'); //for storing a logged-in user's session
const rateLimit = require('express-rate-limit');
const uuid = require('uuid');
var crypto = require('crypto');
const axios = require('axios');

// Database/s setup //
const Promise = require('bluebird'); // For Async
const DB_Op = require('./SQL/dbOperator');
const Repo = require('./SQL/Repository');
const DBBackup = require('./SQL/dbBackup');

const db_op = new DB_Op(process.env.DATABASE_FILE_PATH);
const repo = new Repo(db_op);
const Logger = new LoggerClass();

// Database initialization //
async function initializeDatabase() {
    try {
        //repo.dropTableTargets();
        await repo.createUsersTable();
        console.log("Database initialization completed successfully.");
    } catch (error) {
        console.error("Error initializing the database:", error);
    }
}
initializeDatabase();

// Database backup setup //
function performBackup(){
    dbBackup.backupDatabase((error) => {
        if (error) {
            console.error('Backup error:', error);
        }
    });
}

const dbBackup = new DBBackup();
const db_BackupInterval_hours = process.env.BACKUP_INTERVAL_HOURS;
const intervalInMilliseconds = db_BackupInterval_hours * 60 * 60 * 1000;
performBackup();
setInterval(performBackup, intervalInMilliseconds);

// Webserver //
const { json } = require('express/lib/response');
const app = express();
const server = http.createServer(app);
const bodyParser = require('body-parser');

// WebServer-setup //
const cacheOptions = { // cache options
    maxAge: process.env.CACHE_PERIOD_DAYS, // Cache assets for 7 days
};
if (process.env.ENABLE_CACHING == "true") {
    app.use(compression()); // enable compression
}

// Apply rate limiting middleware globally DDOS PROTECTION WOOOO
if (process.env.ENABLE_RATE_LIMITING == "true") {
    const limiter = rateLimit({
        windowMs: rateLimit_time, // 1 minute
        max: rateLimit_req, // 150 requests per minute
        handler: function(req, res) {
            const clientIP = req.ip;
            Logger.logWarning(`Possible DDOS, to many requests coming from IP: ${clientIP}`);
            notifier.sendNotification("Security", `Possible DDOS, to many requests coming from IP: ${clientIP}`, "security");
            res.status(429).send("Too many requests, please try again later.");
        }
    });
    app.use(limiter);
}

if (process.env.ENABLE_CACHING == "true") {
    app.use("/static", express.static('static', cacheOptions)); //Serving the client js / css / image files from the server
    app.use("/images", express.static('images', cacheOptions));
} else {
    app.use("/static", express.static('static'));
    app.use("/images", express.static('images'));
}

app.use(favicon(__dirname + '/mdLogo.ico')); //setting favicon
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const sessionMiddleware = sessions({
    genid: function(req){
        return crypto.createHash('sha256').update(uuid.v1()).update(crypto.randomBytes(256)).digest("hex");
    }, //each user (logged in or not) gets their own unique session id
    secret: "thisTheSecretKeyeeeererdgfdgd44563df2",
    saveUninitialized: true,
    cookie: {maxAge: 1000 * 60 * 60 * 24}, // 1 day
    resave: false //after maxAge is passed
});
app.use(sessionMiddleware);
app.use(cookieParser()); //so that the server can access the necessary options to save
app.use(bodyParser.json());
app.set('view engine', 'pug'); //enabling pug - template middleware
app.set('views', './views'); // Specify the views directory

const blacklistedIPs = {}; // Object to store blacklisted IPs and their timestamps

function sanitize(input, ip) {
    let sanitizedInput = input.replace(/[&<>"'\/]/g, function (s) {
        console.log(`Potential harmful input from IP ${ip} : ${input}`);
        blacklistedIPs[ipToBlacklist] = Date.now();
        notifier.sendNotification("Security", `Potential harmful input from IP (blacklisted 1h) ${ip} : ${input}`, "security");
        return entityMap[s];
    });
    return sanitizedInput;
}

const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
};

app.use((req, res, next) => {
    const clientIP = req.ip;

    // Check if IP is blacklisted
    if (blacklistedIPs[clientIP]) {
        const currentTime = Date.now();
        const blacklistDuration = 3600000; // 1 hour in milliseconds
        if (currentTime - blacklistedIPs[clientIP] < blacklistDuration) {
            console.log(`IP ${clientIP} is blacklisted. Request rejected.`);
            return res.status(403).send('Your IP address is blacklisted. Please try again later.');
        } else {
            // Remove IP from blacklist after blacklistDuration has passed
            delete blacklistedIPs[clientIP];
        }
    }

    if (req.body) { // Sanitize request body
        Object.keys(req.body).forEach(key => {
            req.body[key] = sanitize(req.body[key], clientIP);
        });
    }
    if (req.query) { // Sanitize request query parameters
        Object.keys(req.query).forEach(key => {
            req.query[key] = sanitize(req.query[key], clientIP);
        });
    }
    next();
});


// Express Routing //
const GET_Route = require('./express_routes/GET');
const POST_Route = require('./express_routes/POST');

const GET_Routes_Array = ['/about', '/login', '/register', '/logout', '/contact'];
GET_Routes_Array.forEach(route => {
    app.get(route, GET_Route);
});

app.get('/', (req, res) => {
  const loggedIn = !!req.session.userid;
  res.render('Home', { UserLoggedIn: loggedIn });
});
  

const POST_Routes_Array = ['/login', '/register'];
POST_Routes_Array.forEach(route => {
    app.post(route, POST_Route);
});

// WebServer Listener/s //
httpServer_Port = process.env.PORT || 3000;
server.listen(httpServer_Port, "0.0.0.0", () => {
    console.log("Http server is running on port *:", httpServer_Port);
});