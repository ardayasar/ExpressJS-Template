const nodeMailer = require('nodemailer');

class Email {
    constructor(email, password, server){
        this.email = email;
        this.password = password;
        this.server = server;
        this.transporter = this.setup();

        if(!this.transporter){
            throw new Error('Email transporter could not be created');
        }
    }

    setup(){
        return nodeMailer.createTransport({
            host: this.server,
            port: 465,
            secure: true,
            auth: {
                user: this.email,
                pass: this.password
            }
        });
    }

    sendMail(mailOptions){
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, (error, info) => {
                if(error){
                    reject(error);
                }
                else{
                    resolve(info);
                }
            });
        });
    };

}

module.exports = Email;