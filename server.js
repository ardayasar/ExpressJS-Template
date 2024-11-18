// var cluster = require('cluster');
const env = require('dotenv').config();

const database_class = require('./selfPackages/database');
const emailService = require('./selfPackages/email');
const colours = require('./selfPackages/colours').colours;
const cookieParser = require('cookie-parser');
const express = require('express');
const io = require('socket.io');
const cors = require('cors');
const http = require('http');
const fs = require('fs');

class ServerModule{
    constructor(){

        if (!process.env.APIKEY || !process.env.DATABASE_HOST) {
            throw new Error('Missing required environment variables. Check your .env file.');
        }

        this.settings = {
            projectName: "WishWeHad",
            projectRoot: __dirname,
            website: "https://wishwehad.com",
            cookie_website: "wishwehad.com",
            port: 4329,
            sessionExpire_day: 1440,
            sessionExpire_week: 10080,
            apiKey: process.env.APIKEY,
            googleSecretKey: process.env.GOOGLESECRETKEY,
            googleRecaptchaKey: process.env.GOOGLERECAPTCHAKEY,
            email_confirmation_address: process.env.EMAIL_CONFIRMATION_MAIL,
            email_confirmation_server: process.env.EMAIL_CONFIRMATION_SERVER,
            email_confirmation_password: process.env.EMAIL_CONFIRMATION_PASSWORD,
            database_host: process.env.DATABASE_HOST,
            database_user: process.env.DATABASE_USER,
            database_password: process.env.DATABASE_PASSWORD,
            database_name: process.env.DATABASE_NAME,
            cors: ['https://wishwehad.com', 'http://localhost', 'localhost']
        };

        this.server = express();
        this.mainServer = http.createServer(this.server);
        this.io = io(this.mainServer);
        this.database = new database_class(this.settings.database_host, this.settings.database_user, this.settings.database_password, this.settings.database_name);
        this.confirmation_email = new emailService(this.settings.email_confirmation_address, this.settings.email_confirmation_password, this.settings.email_confirmation_server);

        this.whitelist = ['/api/user/login', '/api/user/register'];

        this.server.use(express.json());
        this.server.use(express.urlencoded( {extended: true} ));
        this.server.set('io', io);
        this.server.use(cookieParser());
        this.server.use('/images', express.static('images'));
        this.server.use(cors({
            origin: this.settings.cors,
            credentials: true,
        }));

        this.server.use(async (req, res, next) => {
            try{
                if(this.whitelist.includes(req.path)){
                    next();
                    return;
                }

                const email = req.body.email;
                const token = req.body.token;

                if(email && token){
                    const response = await this.database.controlToken(email, token);
                    res.send({status: response});
                    return;
                }

                res.redirect("/login");
                return;
            }
            catch(error){
                console.error(error);
                res.send({status: false, err: {message: "System Error. Please try again later"}});
                return;
            }
        });

        let handlers_folder = fs.readdirSync(`${this.settings.projectRoot}/handlers`);

        for (const handlerFile of handlers_folder) {
            const handlerModule = require(`${this.settings.projectRoot}/handlers/${handlerFile}`);
            const handler = handlerModule(this);
        
            if (!handler.page_route || !handler.methods) {
                console.warn(`Handler ${handlerFile} is missing required properties.`);
                continue; // Skip invalid handlers
            }
        
            for (const method of handler.methods) {
                if (typeof this.server[method] === 'function') {
                    let method_color = method === 'get' ? colours.bg.blue : colours.bg.magenta;
                    let method_text = method === 'get' ? 'GET ' : 'POST';
                    console.log(`${method_color} ${method_text.toUpperCase()} ${colours.bg.green} ${handlerFile} ${colours.reset}`);
                    this.server[method](handler.page_route[method], (req, res) => {
                        handler[method](req, res);
                    });
                } else {
                    console.warn(`Unsupported method ${method} in handler ${handlerFile}`);
                }
            }
        }
    }

    start(){
        this.mainServer.listen(this.settings.port, () => {
            console.log(`${this.settings.projectName} server started on http://localhost:${this.settings.port}/`)
        });
    }
}

const ServerModule = new ServerModule();
ServerModule.start();