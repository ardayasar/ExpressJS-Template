const mysql = require('mysql2/promise');
const crypter = require('./crypto');

class database {
    constructor(host, user, password, database){
        this.host = host;
        this.user = user;
        this.password = password;
        this.database = database;
        
        this.pool = mysql.createPool({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('Database connection established');
    }

    async queryDatabase(query, params) {
        let connection;
        try {
            connection = await this.pool.getConnection();
            const [rows, fields] = await connection.execute(query, params);
            return { rows, fields };
        } catch (error) {
            console.error(error);
            return null;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    };

    async login(mail, password, hashKey) {
        try{
            const response = await this.queryDatabase('SELECT password, username FROM users WHERE email = ?', [mail]);
        
            if(response.rows.length != 1){
                return {status: false, error: "Mail not found"};
            }
    
            let databasePassword = response.rows[0]['password'];
            let newEncrypted = crypter.encryptPassword(password, hashKey);
            
            if(databasePassword == newEncrypted){
                return {status: true, username: response.rows[0]['username']};
            }
            else{
                return {status: false, error: "wrong password"};
            }
        }
        catch(error){
            console.error(error);
            return {status: false, error: "System Error. Please try again later"};
        }
    }

    async generateToken(mail) {
        try{
            const token = crypter.generateToken();
            const response = await this.queryDatabase('UPDATE users SET token = ? WHERE email = ?', [token, mail]);
            if(response.rows.affectedRows == 1){
                return token;
            }
            else{
                return null;
            }
        }
        catch(error){
            console.error(error);
            return {status: false, error: "System Error. Please try again later"};
        }
    }

    async controlToken(mail, token) {
        try{
            const response = await this.queryDatabase('SELECT verified FROM users WHERE email = ? and token = ?', [mail, token]);
            if(response.rows.length != 1){
                return false;
            }
    
            if(response.rows[0]['verified'] == 0){
                return false;
            }
            
            return true;
        }
        catch(error){
            console.error(error);
            return false;
        }
    }

    async register(mail, sender, sender_address, template, verification_key) {
        try{
            const isMailUsed = await this.queryDatabase('SELECT email FROM users WHERE email = ?', [mail]);
            if(isMailUsed.rows.length != 0){
                return {status: false, err: {msg: "Mail is already in use"}};
            }

            // Add last send method to spamming protection
            const lastSend = await this.queryDatabase('SELECT * FROM email_confirmation WHERE email = ? ORDER BY id DESC LIMIT 1', [mail]);
            if(lastSend.rows.length != 0){
                let last_time = new Date(lastSend.rows[0]['time']);
                let now = new Date();
                let diff = now - last_time;
                
                if(diff < 180000){
                    return {status: false, err: {msg: "Please wait 3 minute before sending another verification code"}};
                }
            }
    
            //Generate 6 digit code
            sender.sendMail({
                from: `Account Register Services <no-reply@${sender_address}>`,
                to: mail,
                subject: 'Register Verification',
                html: template
            });
    
            const response = await this.queryDatabase('INSERT INTO email_confirmation (email, code) VALUES (?, ?)', [mail, verification_key]);
            if(response.rows.affectedRows == 1){
                return {status: true};
            }
            else{
                return {status: false};
            }
        }
        catch(error){
            console.error(error);
            return {status: false, error: "System Error. Please try again later"};
        }
    }

    async registerVerification(mail, password, verification_key, hashKey) {
        try{
            const isMailUsed = await this.queryDatabase('SELECT email FROM users WHERE email = ?', [mail]);
            if(isMailUsed.rows.length != 0){
                return {status: false, error: "mail is already in use"};
            }
    
            const isVerificationKeyUsed = await this.queryDatabase('SELECT * FROM email_confirmation WHERE email = ? ORDER BY id DESC LIMIT 1', [mail]);
            
            if(isVerificationKeyUsed.rows.length != 0){
                let last_time = new Date(isVerificationKeyUsed.rows[0]['time']);
                let now = new Date();
                let diff = now - last_time;

                if(isVerificationKeyUsed.rows[0]['code'] == verification_key){
                    if(diff > 300000){
                        return {status: false, err: {msg: "Verification code is expired"}};
                    }

                    const encryptedPassword = crypter.encryptPassword(password, hashKey);
                    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
                    const response = await this.queryDatabase('INSERT INTO users (email, password, created, verified) VALUES (?, ?, ?, ?)', [mail, encryptedPassword, currentDateTime, 1]);
                    
                    if(response.rows.affectedRows == 1){
                        return {status: true};
                    }
                    else{
                        return {status: false};
                    }
                }
                else{
                    return {status: false, err: {msg: "Wrong verification key"}};
                }
            }
            else{
                return {status: false, err: {msg: "Account not registered"}};
            }
        }
        catch(error){
            console.error(error);
            return {status: false, error: "System Error. Please try again later"};
        }
    }
}

module.exports = database;