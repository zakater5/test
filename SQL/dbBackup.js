const fs = require('fs');
const path = require('path');
let lastBackupTimestamp = null;
const LoggerClass = require('../Logger');
const Logger = new LoggerClass();

//const LoggerClass = require('../Logger');
//const Logger = new LoggerClass();


class dbBackup{
    constructor(){
        this.databasePath = path.join(__dirname, '.'+process.env.DATABASE_FILE_PATH);
        this.backupPath = path.join(__dirname, '.'+process.env.BACKUP_DATABASE_FILE_PATH);
    }

    backupDatabase(callback){
        fs.copyFile(this.databasePath, this.backupPath, (error) => {
          if (error) {
            console.error('Database backup failed:', error);
            Logger.logError('Database backup failed:', error);
          } else {
            lastBackupTimestamp = new Date().toLocaleString();
            console.log('Database backup successfully created at: ', lastBackupTimestamp);
            Logger.logSuccess(`Database backup successfully created at: ${lastBackupTimestamp}`);
          }

          if(callback && typeof callback === 'function'){
            callback(error);
          }
        });
    }

    getLastBackupTimestamp(){
        if(lastBackupTimestamp){
            return lastBackupTimestamp;
        } else {
            return "No recent backup."
        }
    }
}

module.exports = dbBackup;
