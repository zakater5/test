
class Repo {
    constructor(DB_Op){
        this.DB_Op = DB_Op;
    }

    async encryptTableValues(tableName, key) {
        try {
            // Retrieve all values from the specified table
            const rows = await this.DB_Op.all(`SELECT * FROM ${tableName}`);
            // Loop through each row
            for (const row of rows) {
                // Loop through each column in the row
                Object.keys(row).forEach(column => {
                    // Encrypt the value in the column (if it's not null)
                    if (row[column] !== null) {
                        const encryptedValue = this.DB_Op.encryptData(row[column], key);
                        // Update the table with the encrypted value
                        this.DB_Op.run(`UPDATE ${tableName} SET ${column} = ? WHERE id = ?`, [encryptedValue, row.id], err => {
                            if (err) {
                                console.error(err.message);
                            } else {
                                console.log(`Updated ${tableName}.${column} with encrypted value`);
                            }
                        });
                    }
                });
            }
        } catch (err) {
            console.error(err.message);
        }
    }

    async decryptTableValues(tableName, key) {
        try {
            // Retrieve all values from the specified table
            const rows = await this.DB_Op.all(`SELECT * FROM ${tableName}`);
            // Loop through each row
            for (const row of rows) {
                // Loop through each column in the row
                Object.keys(row).forEach(column => {
                    // Decrypt the value in the column (if it's not null)
                    if (row[column] !== null) {
                        const decryptedValue = this.DB_Op.decryptData(row[column], key);
                        // Update the table with the decrypted value
                        this.DB_Op.run(`UPDATE ${tableName} SET ${column} = ? WHERE id = ?`, [decryptedValue, row.id], err => {
                            if (err) {
                                console.error(err.message);
                            } else {
                                console.log(`Updated ${tableName}.${column} with decrypted value`);
                            }
                        });
                    }
                });
            }
        } catch (err) {
            console.error(err.message);
        }
    }

    async dropTable(tableName) {
        try {
            // Drop the specified table
            await this.DB_Op.run(`DROP TABLE ${tableName}`);
            console.log(`Dropped table: ${tableName}`);
        } catch (err) {
            console.error(`Error dropping table ${tableName}: ${err.message}`);
        }
    }    

    // ----------------------------------> Writing to DB 'methods'
    createUsersTable(){ // Creates a new table (In this case it creates the Users table) / isVerified = email verified (0 = false, 1 = true) 
        const sql = `
            CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                password TEXT NOT NULL,
                email TEXT NOT NULL,
                isVerified NUMBER(1) NOT NULL,
                accountTier TEXT NOT NULL,
                dateJoined DATETIME NOT NULL,
                avatarImage TEXT,
                bannerImage TEXT,
                about TEXT,
                agreed_to_terms NUMBER(1),
                agreed_to_promotions NUMBER(1)
            )`
        return this.DB_Op.run(sql); // remote_sessions = remote machines logged in as this user
    }

    async RegisterUser(email, first_name, last_name, password, agree_terms, agree_promotions){ // Registers a new user
        const hashedPassword = this.DB_Op.hashData(password);
        const accountTier = email === "Admin@gmail.com" ? "Admin" : "Member";

        return this.DB_Op.encrypted_run(
            `INSERT INTO Users (first_name, last_name, password, email, isVerified, accountTier, dateJoined, avatarImage, bannerImage, about, agreed_to_terms, agreed_to_promotions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, hashedPassword, email, 0, accountTier, new Date().toLocaleString(), "null", "null", "null", agree_terms, agree_promotions]
        );        
    }

    updatePassword(email, newPassword){ // Updates the password of the specified user
        const password = newPassword;
        const hashedPassword = this.DB_Op.hashData(password);
        return this.DB_Op.encrypted_run(
            `UPDATE Users SET password = ? WHERE email = ?`,
            [hashedPassword, email]
        );
    }

    deleteUser(email){ // Deletes row from database where the specified user exists
        return this.DB_Op.encrypted_run(
            `DELETE FROM Users WHERE email = ?`,
            [email]
        );
    }

    updateUserProfile(email, about, userAvatar, userBanner){ // Updates a user's profile
        return this.DB_Op.encrypted_run(
            `UPDATE Users SET about = ?, avatarImage = ?, bannerImage = ? WHERE email = ?`,
            [about, userAvatar, userBanner, email]
        );
    }

    // ----------------------------------> Reading from DB 'methods'
    getAllUserInfo(userId){ // returns all info to the coresponding user
        return this.DB_Op.encrypted_get(
            `SELECT * FROM Users WHERE email = ?`,
            [userId]
        );
    }

    getByUsername(email){ // Displays all data from the rows in which the specified username exists
        return this.DB_Op.encrypted_get(
            `SELECT * FROM Users WHERE email = ?`,
            [email]
        );
    }

    getByEmail(email){
        return this.DB_Op.encrypted_get( // Returns an email address if it exists
            `SELECT email FROM Users WHERE email = ?`,
            [email]
        );
    }

    getUserPassword_byUser(email) {
        return this.DB_Op.encrypted_get(
            `SELECT password FROM Users WHERE email = ?`,
            [email]
        ).then(result => {
            if (result) {
                const hashedPassword = this.DB_Op.hashData(result.password);
                return hashedPassword; // Return the hashed password
            } else {
                throw new Error("User not found"); // Handle the case where the user doesn't exist
            }
        });
    }

    compareUserPassword(email, enteredPassword){
        return this.DB_Op.encrypted_get(
            `SELECT password FROM Users WHERE email = ?`,
            [email]
        ).then(result => {
            if (result) {
                const entered_hashedPassword = this.DB_Op.hashData(enteredPassword);
                if (entered_hashedPassword == result.password){
                    return true;
                } else {
                    return false;
                }
            } else {
                throw new Error("User not found"); // Handle the case where the user doesn't exist
            }
        });
    }
    

    getUserAccountTier(email){
        return this.DB_Op.encrypted_get(
            `SELECT accountTier FROM Users WHERE email = ?`,
            [email]
        );
    }

    getAllUsers(){ // Returns every user's data
        return this.DB_Op.encrypted_all(`SELECT * FROM Users`);
    }

    verifyUser(email){
        return this.DB_Op.encrypted_run(
            `UPDATE Users SET isVerified = ? WHERE email = ?`,
            ['1', email]
        );
    }
}

module.exports = Repo;
