
const sqlite3 = require('sqlite3');
const Promise = require('bluebird');
const crypto = require('crypto');

class AppDB {
    constructor(dbFilePath){ // Creates new SQLite3 Database
        this.db = new sqlite3.Database(dbFilePath, (err) => {
            if(err){
                console.log("Error connecting to database: ", err);
            } else {
                console.log("Connected to database.");
            }
        });
    }

    hashData(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    run(sql, params = []){ // Runs an SQL query
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err){
                if(err){
                    console.log("Error executing SQL code: ", sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID});
                }
            });
        });
    }

    get(sql, params = []){ // Gets a single row of data
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if(err){
                    console.log("Error retrieving data from db: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    all(sql, params = []){ // Gets many rows of data
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if(err){
                    console.log("Error getting rows of data: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    encrypted_run(sql, params = []) { // Runs an SQL query with encrypted parameters
        // Encrypt each parameter before running the query
        const encryptedParams = params.map(param => this.encryptData(param, process.env.DB_ENCRYPTION_KEY));
        return new Promise((resolve, reject) => {
            this.db.run(sql, encryptedParams, function (err) {
                if (err) {
                    console.log("Error executing SQL code: ", sql);
                    console.log(err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }
    
    encrypted_get(sql, params = []) { // Gets a single row of data with encrypted parameters
        // Encrypt each parameter before running the query
        const encryptedParams = params.map(param => this.encryptData(param, process.env.DB_ENCRYPTION_KEY));
        return new Promise((resolve, reject) => {
            this.db.get(sql, encryptedParams, (err, result) => {
                if (err) {
                    console.log("Error retrieving data from db: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    if (result) {
                        result = this.decryptRow(result, process.env.DB_ENCRYPTION_KEY);
                    }
                    resolve(result);
                }
            });
        });
    }    

    encrypted_all(sql, params = []) { // Gets many rows of data with encrypted parameters
        // Encrypt each parameter before running the query
        const encryptedParams = params.map(param => this.encryptData(param, process.env.DB_ENCRYPTION_KEY));
        return new Promise((resolve, reject) => {
            this.db.all(sql, encryptedParams, (err, rows) => {
                if (err) {
                    console.log("Error getting rows of data: " + sql);
                    console.log(err);
                    reject(err);
                } else {
                    if (rows) {
                        rows = rows.map(row => this.decryptRow(row, process.env.DB_ENCRYPTION_KEY));
                    }
                    resolve(rows);
                }
            });
        });
    }    

    // Encrypt data using AES encryption algorithm
    encryptData(data, key) {
        if (typeof data === 'number') {
            // If the data is a number, return it as is without encryption
            return data.toString();
        } else {
            const cipher = crypto.createCipher('aes-256-cbc', key);
            let encryptedData = cipher.update(data, 'utf8', 'hex');
            encryptedData += cipher.final('hex');
            return encryptedData;
        }
    }

    // Decrypt data using AES decryption algorithm
    decryptData(encryptedData, key) {
        // If the encrypted data is a number, return it as is without decryption
        if (!isNaN(Number(encryptedData))) {
            return encryptedData;
        } else {
            const decipher = crypto.createDecipher('aes-256-cbc', key);
            let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
            decryptedData += decipher.final('utf8');
            return decryptedData;
        }
    }

    // Encrypt each value in a row
    encryptRow(row, key) {
        for (const prop in row) {
            if (Object.hasOwnProperty.call(row, prop)) {
                if (typeof row[prop] !== 'number' && row[prop] != null) {
                    row[prop] = this.encryptData(row[prop], key);
                }
            }
        }
        return row;
    }

    // Decrypt each value in a row
    decryptRow(row, key) {
        for (const prop in row) {
            if (Object.hasOwnProperty.call(row, prop)) {
                if (typeof row[prop] !== 'number' && row[prop] != null) {
                    row[prop] = this.decryptData(row[prop], key);
                }
            }
        }
        return row;
    }
}

module.exports = AppDB;
